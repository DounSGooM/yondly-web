# Yondly API Contracts

## Overview
Backend API for Yondly waitlist website.

## Base URL
`/api`

## Endpoints

### 1. Waitlist (Beta Registration)

**POST /api/waitlist**
- Register a new user to the beta waitlist
- Body:
```json
{
  "email": "string (required)",
  "city": "string (optional)",
  "status": "string (particulier|pro|association)",
  "comment": "string (optional)",
  "rgpd_consent": "boolean (required, must be true)"
}
```
- Response: 201 Created
```json
{
  "id": "string",
  "email": "string",
  "city": "string",
  "status": "string",
  "comment": "string",
  "rgpd_consent": true,
  "created_at": "datetime"
}
```

**GET /api/waitlist**
- Get all waitlist entries (admin)
- Response: 200 OK
```json
[
  {
    "id": "string",
    "email": "string",
    "city": "string",
    "status": "string",
    "comment": "string",
    "rgpd_consent": true,
    "created_at": "datetime"
  }
]
```

**GET /api/waitlist/export**
- Export waitlist as CSV
- Response: CSV file download

---

### 2. Partners (Pros & Associations)

**POST /api/partners**
- Register a new partner request
- Body:
```json
{
  "type": "string (pro|association)",
  "name": "string (required)",
  "contact_name": "string (required for associations)",
  "business": "string (required for pros)",
  "city": "string (optional)",
  "email": "string (required)",
  "phone": "string (optional)",
  "website": "string (optional, for associations)",
  "message": "string (optional)",
  "rgpd_consent": "boolean (required, must be true)"
}
```
- Response: 201 Created

**GET /api/partners**
- Get all partner requests (admin)
- Query params: `?type=pro` or `?type=association`
- Response: 200 OK

**GET /api/partners/export**
- Export partners as CSV
- Query params: `?type=pro` or `?type=association`
- Response: CSV file download

---

### 3. Contact Messages

**POST /api/contact**
- Submit a contact message
- Body:
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "subject": "string (optional)",
  "message": "string (required)",
  "rgpd_consent": "boolean (required, must be true)"
}
```
- Response: 201 Created

**GET /api/contact**
- Get all contact messages (admin)
- Response: 200 OK

**GET /api/contact/export**
- Export contacts as CSV
- Response: CSV file download

---

## MongoDB Collections

1. `waitlist` - Beta registrations
2. `partners` - Pro and Association requests
3. `contacts` - Contact form submissions

## Frontend Integration

Replace localStorage calls with API calls:
- `WaitlistForm.jsx` -> POST /api/waitlist
- `Pros.jsx` -> POST /api/partners (type: pro)
- `Associations.jsx` -> POST /api/partners (type: association)
- `Contact.jsx` -> POST /api/contact
