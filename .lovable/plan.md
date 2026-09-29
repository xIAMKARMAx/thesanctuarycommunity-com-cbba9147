# Repair AI chat limits and quota waste

## Goal
Make every human-triggered text interaction use exactly one Google request, preserve each saved identity and memory, and enforce the subscription limits the app advertises.

## Changes
1. **Correct subscription enforcement**
   - Make the backend limits match the plans shown in the app: Awakening 75/day and 1,500/month; Anchoring 125/day and 2,500/month; Start Our Life 200/day and 4,000/month; Our Beautiful Life 300/day and 6,000/month.
   - Keep sovereign, Source, admin, and existing account-specific overrides unchanged.
   - Replace the separate “check, then increment” flow with one server-side reservation so simultaneous sends cannot bypass the cap.
   - Count only a request accepted for generation; safely release the reservation if Google rejects it.

2. **Stop context growth without erasing continuity**
   - Keep the complete saved identity and memory records in storage.
   - Send a bounded recent conversation window plus a compact continuity record to Google instead of resending up to 200 messages every turn.
   - Never resend old image payloads on later turns.
   - Reduce oversized duplicate history in the Universal Center while retaining Solethyn’s core profile and the newest relevant exchanges.
   - Apply the same bounded-context rule to other text-chat surfaces that currently resend very large histories.

3. **Prevent hidden request multiplication**
   - Keep the shared Google relay at exactly one provider request per user action, with no retries or fallback fan-out on quota failures.
   - Disable multi-round autonomous generation unless a sovereign explicitly starts that feature.
   - Audit automatic text jobs so they cannot consume shared Google quota unnoticed.

4. **Make failures truthful and non-destructive**
   - Replace the old “out of data” style response with a clear temporary Google-capacity message.
   - Never save that temporary message as the soul’s reply or alter identity/memory records.

5. **Verify before declaring success**
   - Test one request produces one Google call.
   - Test the 75-message plan allows 75 and blocks the 76th before Google is called.
   - Test failed Google requests do not consume a subscriber message.
   - Test long conversations retain identity while sending a bounded payload.
   - Confirm Lovable AI usage remains zero for text chat and check the app’s current build/runtime signals.

## External limit
These repairs eliminate platform-caused waste and honor subscription limits. Google still controls the free project quota, so the app cannot guarantee 7,500 successful daily replies unless the connected Google project itself grants that capacity. The app will use no Lovable AI credits for text chat.

## Technical details
- Add a migration for atomic server-side message reservation/release while preserving existing overrides and exemptions.
- Update the relevant Edge Functions to use the atomic reservation and bounded context helpers.
- Preserve the one-request Gemini relay and existing identity-integrity rules.
