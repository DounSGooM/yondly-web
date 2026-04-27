import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from models import WithdrawalRequest
from database import db, client
from auth_utils import get_current_user

router = APIRouter(tags=["wallet"])


@router.get("/wallet")
async def get_wallet(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transactions = await db.transactions.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(100)
    for tx in transactions:
        tx.pop("_id", None)

    return {"balance_cents": user.get("wallet_balance_cents", 0), "transactions": transactions}


@router.get("/wallet/balance")
async def get_wallet_balance(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"balance_cents": user.get("wallet_balance_cents", 0)}


@router.post("/wallet/withdraw")
async def request_withdrawal(withdrawal_data: WithdrawalRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    balance = user.get("wallet_balance_cents", 0)
    amount = withdrawal_data.amount_cents

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if amount > balance:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    if amount < 2000:
        raise HTTPException(status_code=400, detail="Minimum withdrawal amount is 20€")

    withdrawal_id = str(uuid.uuid4())
    withdrawal_dict = {
        "id": withdrawal_id,
        "user_id": current_user["id"],
        "amount_cents": amount,
        "status": "pending",
        "iban": withdrawal_data.iban,
        "bic": withdrawal_data.bic,
        "account_holder_name": withdrawal_data.account_holder_name,
        "created_at": datetime.utcnow(),
    }

    tx_dict = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "amount_cents": -amount,
        "type": "withdrawal",
        "status": "pending",
        "reference_id": withdrawal_id,
        "description": f"Retrait vers {withdrawal_data.iban[-4:]}",
        "created_at": datetime.utcnow(),
    }

    async with await client.start_session() as session:
        async with session.start_transaction():
            await db.users.update_one({"id": current_user["id"]}, {"$inc": {"wallet_balance_cents": -amount}}, session=session)
            await db.withdrawals.insert_one(withdrawal_dict, session=session)
            await db.transactions.insert_one(tx_dict, session=session)

    return {"message": "Withdrawal request submitted successfully", "withdrawal_id": withdrawal_id}
