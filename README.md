# Gemini Reflection Journal with Firebase Firestore & Google Auth

An AI-assisted journaling and multi-turn reflection web application built with **Firebase Authentication (Google Sign-In)**, **Cloud Firestore** for user-isolated persistence, and the **Gemini 3.6 Flash API** for conversational inquiry, synthesis, and brainstorming.

---

## 🏗️ Architecture & Security Model

1. **User Identity & Federated Auth**:
   - Google Sign-In via Firebase Auth.
   - Zero storage of raw emails or passwords in custom databases.
2. **User Data Isolation (Zero Insecure Defaults)**:
   - All reflections and messages are scoped strictly under `/users/{userId}/interactions/{interactionId}`.
   - Firestore security rules mandate `request.auth != null && request.auth.uid == userId`.
3. **Server-Side AI Proxy & Resilience**:
   - `GEMINI_API_KEY` is kept server-side only in Express.
   - Automated 4-tier model fallback ladder (`gemini-2.5-flash` &rarr; `gemini-2.5-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-2.5-pro`).
   - Clean payload sanitization stripping `undefined` fields prior to Firestore writes.

---

## 🛡️ Cloud Firestore Security Rules

Deploy the following `firestore.rules` to enforce strict owner isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }

      match /journals/{journalId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;

        match /messages/{messageId} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

---

## 🔐 Google Cloud Secret Manager & IAM Bindings

To securely configure API keys in Google Cloud Run:

```bash
# 1. Create and populate the Gemini API key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment

Deploy the container to Cloud Run with environment secrets and mandatory verification tags:

```bash
# Deploy service to Cloud Run
gcloud run deploy gemini-reflection-journal \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --port 3000

# Apply mandatory campaign verification label
gcloud run services update gemini-reflection-journal \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

---

## 📋 Comprehensive Functional Walkthrough & Test Guide

| Step ID | Feature / Flow | Action | Expected Outcome |
| :--- | :--- | :--- | :--- |
| **TC-01** | Landing & Auth State | Navigate to root URL while logged out. | Landing page renders with Sign In button, security badge, and feature breakdown. |
| **TC-02** | Google Sign-In | Click "Continue with Google" or "Sign In". | Firebase popup prompts Google OAuth; on success, routes immediately to private dashboard. |
| **TC-03** | History Isolation | Verify left sidebar. | Displays past reflections belonging exclusively to the authenticated user ID. |
| **TC-04** | Multi-Turn Reflection | Type reflection text into input and submit. | User message appears instantly in chat; Gemini streams/replies with structured insight. |
| **TC-05** | Transaction Integrity | Inspect Firestore / status indicators. | Both user prompt and Gemini response are saved to Firestore under `/users/{uid}/interactions/`. |
| **TC-06** | Reflection Modes | Switch between "Executive Summary", "Brainstorming", "Action Steps". | Changes prompt persona and produces specialized synthesis for subsequent turns. |
| **TC-07** | Tagging & Search | Add tags (`#mindfulness`, `#work`) and use search bar. | Real-time filtering updates the history sidebar to display matching entries. |
| **TC-08** | Delete & Sign Out | Click delete icon on an entry, then click Sign Out. | Deletes document from Firestore; sign out returns to landing page with cleared local state. |
