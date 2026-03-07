"""
Stripe Webhook Handler
Handles webhook events from Stripe for payment processing.
"""
import stripe
import logging
from fastapi import Request, HTTPException
from datetime import datetime
import os
from push_service import send_push_notification

# Configure logging
logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


async def handle_stripe_webhook(request: Request, db, stripe_config: dict):
    """
    Handle Stripe webhook events.
    Verifies signature and processes payment events.
    """
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing signature header")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_config['webhook_secret']
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle event types
    event_type = event['type']
    event_data = event['data']['object']
    
    if event_type == 'payment_intent.succeeded':
        await handle_payment_succeeded(db, event_data)
    elif event_type == 'checkout.session.completed':
        await handle_checkout_completed(db, event_data)
    elif event_type == 'payment_intent.payment_failed':
        await handle_payment_failed(db, event_data)
    elif event_type == 'charge.refunded':
        await handle_refund(db, event_data)
    else:
        logger.info(f"Unhandled webhook event: {event_type}")
    
    return {"received": True}


async def handle_payment_succeeded(db, payment_intent):
    """Handle successful payment."""
    metadata = payment_intent.get('metadata', {})
    order_id = metadata.get('order_id')
    rental_id = metadata.get('rental_id')
    
    if order_id:
        # --- ORDER / SALE LOGIC ---
        order = await db.orders.find_one({"id": order_id})
        if not order:
            logger.error(f"Order {order_id} not found for successful payment")
            return
        
        # Update order status to escrowed
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "payment_status": "escrowed",
                    "paid_at": datetime.utcnow(),
                    "stripe_payment_intent": payment_intent.get('id')
                }
            }
        )
        
        # Mark item as reserved (ONLY FOR SALES)
        await db.items.update_one(
            {"id": order.get("item_id")},
            {"$set": {"status": "reserved"}}
        )
        
        # Create notification for seller
        item = await db.items.find_one({"id": order.get("item_id")})
        if item:
            await db.notifications.insert_one({
                "user_id": order["seller_id"],
                "type": "order_status",
                "title": "Nouvelle vente !",
                "message": f"Votre article '{item['title']}' a été vendu !",
                "order_id": order_id,
                "read": False,
                "created_at": datetime.utcnow()
            })
            
            await send_push_notification(
                order["seller_id"],
                "Nouvelle vente !",
                f"Votre article '{item['title']}' a été vendu !"
            )
        
        logger.info(f"Payment succeeded for order {order_id}")

    elif rental_id:
        # --- RENTAL LOGIC ---
        rental = await db.rentals.find_one({"id": rental_id})
        if not rental:
            logger.error(f"Rental {rental_id} not found for successful payment")
            return

        # Update rental status
        await db.rentals.update_one(
            {"id": rental_id},
            {
                "$set": {
                    "status": "confirmed",
                    "payment_status": "fully_paid",
                    "paid_at": datetime.utcnow(),
                    "payment_intent_id": payment_intent.get('id')
                }
            }
        )
        
        # DO NOT mark item as reserved for rentals, as it stays available for other dates.
        
        # Notify owner
        item = await db.items.find_one({"id": rental.get("item_id")})
        if item:
            await db.notifications.insert_one({
                "user_id": rental["owner_id"],
                "type": "rental_booked",
                "title": "Nouvelle réservation confirmée !",
                "message": f"Location confirmée pour '{item['title']}' (payée via Stripe).",
                "rental_id": rental_id,
                "read": False,
                "created_at": datetime.utcnow()
            })
            
            await send_push_notification(
                rental["owner_id"],
                "Location confirmée !",
                f"Location confirmée pour '{item['title']}'."
            )

        logger.info(f"Payment succeeded for rental {rental_id}")

    else:
        logger.warning("Payment succeeded but no order_id or rental_id in metadata")


from datetime import timedelta

async def handle_checkout_completed(db, session):
    """Handle successful checkout session (e.g. for paid boosts)."""
    metadata = session.get('metadata', {})
    if metadata.get('type') == 'pay_boost':
        item_id = metadata.get('item_id')
        user_id = metadata.get('user_id')
        pack = int(metadata.get('boost_pack', 1))
        
        if not item_id or not user_id:
            logger.error("Missing item_id or user_id in boost checkout metadata")
            return
            
        item = await db.items.find_one({"id": item_id})
        if not item:
            logger.error(f"Item {item_id} not found for boost payment")
            return
            
        # Add 7 days per boost in the pack
        boost_duration = timedelta(days=7 * pack)
        current_boost = item.get("boosted_until")
        now = datetime.utcnow()
        
        if current_boost and current_boost > now:
            new_boost_until = current_boost + boost_duration
        else:
            new_boost_until = now + boost_duration
            
        await db.items.update_one(
            {"id": item_id},
            {"$set": {"boosted_until": new_boost_until}}
        )
        
        # Notify the user
        await db.notifications.insert_one({
            "user_id": user_id,
            "type": "boost_applied",
            "title": "Annonce boostée ! 🚀",
            "message": f"Votre annonce '{item['title']}' sera mise en avant jusqu'au {new_boost_until.strftime('%d/%m/%Y')}.",
            "item_id": item_id,
            "read": False,
            "created_at": now
        })
        
        logger.info(f"Paid boost ({pack}x) applied for item {item_id}")



async def handle_payment_failed(db, payment_intent):
    """Handle failed payment."""
    order_id = payment_intent.get('metadata', {}).get('order_id')
    
    if not order_id:
        return
    
    # Update order status
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {
                "payment_status": "failed",
                "failed_at": datetime.utcnow(),
                "failure_reason": payment_intent.get('last_payment_error', {}).get('message', 'Unknown error')
            }
        }
    )
    
    logger.warning(f"Payment failed for order {order_id}")


async def handle_refund(db, charge):
    """Handle refund events."""
    payment_intent_id = charge.get('payment_intent')
    
    if not payment_intent_id:
        return
    
    # Find order by payment intent
    order = await db.orders.find_one({"stripe_payment_intent": payment_intent_id})
    
    if not order:
        logger.warning(f"No order found for refunded payment intent {payment_intent_id}")
        return
    
    # Update order status
    await db.orders.update_one(
        {"id": order["id"]},
        {
            "$set": {
                "payment_status": "refunded",
                "refunded_at": datetime.utcnow(),
                "refund_amount_cents": charge.get('amount_refunded', 0)
            }
        }
    )
    
    # Restore item availability
    await db.items.update_one(
        {"id": order.get("item_id")},
        {"$set": {"status": "active"}}
    )
    
    # Notify buyer
    await db.notifications.insert_one({
        "user_id": order["buyer_id"],
        "type": "refund_completed",
        "title": "Remboursement effectué",
        "message": "Votre remboursement a été traité avec succès.",
        "order_id": order["id"],
        "read": False,
        "created_at": datetime.utcnow()
    })
    
    logger.info(f"Refund processed for order {order['id']}")


async def process_refund(db, order_id: str, reason: str = None):
    """
    Initiate a refund for an order.
    Called by admin or dispute resolution.
    """
    order = await db.orders.find_one({"id": order_id})
    
    if not order:
        raise ValueError("Order not found")
    
    if order["payment_status"] not in ["escrowed", "released"]:
        raise ValueError(f"Cannot refund order with status: {order['payment_status']}")
    
    payment_intent_id = order.get("stripe_payment_intent") or order.get("payment_intent_id")
    
    if not payment_intent_id or 'demo' in payment_intent_id or 'simulated' in payment_intent_id:
        # Demo mode - just update status
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "payment_status": "refunded",
                    "refunded_at": datetime.utcnow(),
                    "refund_reason": reason
                }
            }
        )
        return {"status": "refunded", "demo": True}
    
    # Real Stripe refund
    try:
        refund = stripe.Refund.create(
            payment_intent=payment_intent_id,
            reason=reason or "requested_by_customer"
        )
        
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "payment_status": "refund_pending",
                    "stripe_refund_id": refund.id,
                    "refund_reason": reason
                }
            }
        )
        
        return {"status": "refund_pending", "refund_id": refund.id}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe refund error: {e}")
        raise ValueError(f"Refund failed: {str(e)}")
