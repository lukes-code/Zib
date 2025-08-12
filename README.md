## Zib
A fullstack events app with built in credit system.
Made for a local hockey team (but could scale out to multi-tenanted SaaS).

Brief:
Team currently uses polls in whatsApp to see who is attending training for a given day, but training is capped at X amount and players are able to say they're attending without paying.

Zib functionality:
- Secure sign up and sign in (with email verification added too)
- Admin portal
  - Create events (name, data, cap amount etc.)
  - Adjust credits per user (add credits to users once paid, remove for misuse etc.)
  - View who is attending (so teams can be created)
  - Log system - see transaction history of who triggered what events in system (e.g. +1 credit added to X by Y user)
  - Delete events (with automatic refunding)
  - Remove & reufund individual users
- User dashboard
  - See all future events
  - See stats (credits, past attended events, current attending)
  - Attend events (if theres space and you have sufficient credits)
 
Desktop & mobile responsive

Tech details:
- React (vite)
- TypeScript
- SupaBase
- Tailwind
- Radix ui icons


Screenshots:
<img width="1728" height="998" alt="image" src="https://github.com/user-attachments/assets/8d8a6734-271a-4ae5-845c-3ca1831f8f51" />
<img width="808" height="682" alt="image" src="https://github.com/user-attachments/assets/63476bd6-5513-4ba2-bc6a-1c5d49905fa6" />
<img width="1728" height="989" alt="image" src="https://github.com/user-attachments/assets/774d541e-ca0d-4449-8803-4cb557bac5d0" />
<img width="551" height="407" alt="image" src="https://github.com/user-attachments/assets/06e3df1a-7d08-487b-b1db-1fb81d29ef02" />

Plus a log page full on transaction details which I could not be bothered to fill with redacted data, so imagine a default table (nothing pretty).

Mobile:
<img width="493" height="717" alt="image" src="https://github.com/user-attachments/assets/ef5a8a38-05dc-4e21-b10c-f7527b080069" />
<img width="499" height="905" alt="image" src="https://github.com/user-attachments/assets/9df956a5-2163-432e-b9c9-2bc551a2d78e" />

