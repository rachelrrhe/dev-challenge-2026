# Write-up

> This is the skeleton - replace everything in blockquotes with your own words
> and delete the prompts as you go. Aim for **~300 words** across the four
> questions; the route reference below can be as long as it needs to be.
>
> Write it like you're handing the work to a teammate. We'd rather read an
> honest "I ran out of time on X and here's what I'd do" than a polished list of
> accomplishments. **Submit this even if you didn't finish** - see CHALLENGE.md.

## 1. What did you build for Part B, and why that?
I added a My Visits page with a VisitsCalendar feature to record the visits and spending by date. The page displays restaurants visited, amount spent each day in the boxes of the calendar, it contains monthly and yearly modes that each presents total spending, visits and favorite restaurant.
I chose to build this because it serves the main purpose of tracking Brennen's visits and spending in one page, and is visually clear and appealing such that it attracts users. Inspired by Alipay's calender tracker for daily financial investment gains/loss and the GitHub contributions graph, I decided calendar the best way to present the date number, spending number and restaurant(in form of picture background) all in one grid without being too messy. 

## 2. What did you decide, and what did you rule out?

I decided to cut functions like search/map/online rating posting due to time issues and because they are common in other food apps but do not related to this app's purpose as a personal tracker instead of an social explorer so I abandoned the notes in visits table. I added dish_photo for restaurants to make it more visually appealing and updated_at to distinct cases of revisiting the same restaurant.
I merged my initial idea of My Visits and My Spending page together into the VisitsCalendar. So the route /api/spending and the spending types in apiClient were all abandoned. Instead I added VisitWithRestaurant, RestaurantSpending, and SpendingSummary interfaces for storing spending and number of visits by restaurant, date, and the sum.

## 3. Where did you cut corners?

I used AI for many frontend features in this code, and I still think my current way of storing spendingByRestaurant, spendingByDate in three interfaces is messy. I may edit the frontend more manually in the future, and also re-organize my way of storing Calendar data by maybe creating a seperate Month or Year table.

---

## Part B: routes

> Every endpoint you added, with its request and response shapes, so we can
> exercise it without reverse-engineering your code. Add or remove rows as
> needed; delete this section if your Part B added no routes.

| Method and path | What it does | Success | Errors       |
| --------------- | ------------ | ------- | ------------ |
| `Get /api/restaurants` | Return restaurant (added dish_photo and updated_at for each) | `200` + JSON array| - |
| `POST /api/restaurants` | Create new restaurant (containing an optional dish_photo) | `201` + created restaurant | `400` if invalid input or duplicate|
| `GET /api/restaurants/:id` and `PUT /api/restaurants/:id` and `DELETE /api/restaurants/:id`| ... same as before(included updated_at and dish_photo) | same | same|
| `PATCH /api/restaurants/:id` | Update updated_at and dish_photo restaurant if its revisited| `200` + updated restaurant| `400` if invalid input; `404` if missing restaurant |
| `GET /api/visits`|Returns every visit, most recent first, with the restaurant name joined in | `200` + JSON array| - |
| `POST /api/visits` |Record a new visit, updates the restaurant | `201` + created visit | `400` on invalid input; `404` if restaurant body don't exist|
| `DELETE /api/visits/:id` | Delete a visit log (by clicking button on home page) | `204`, no body |`404` if missing or or invalid id |

**`POST /api/visits`**

```jsonc
// request
{ "restaurantId": 1, "amountSpent": 21, "dishPhoto": "data:image/png;base64,..." }

// 201 response
{
  "id": 7,
  "restaurantId": 1,
  "date": "2026-09-09",
  "amountSpent": 21,
  "notes": null,
  "dishPhoto": "data:image/png;base64,...",
  "createdAt": "2026-09-09T00:00:00.000Z"
}
```
**`PATCH /api/restaurants/1`**
```jsonc
// request
{"dishPhoto": "data:image/png;base64,..."}

// 200 response
{
  "id": 1,
  "name": "Example Restaurant",
  "cuisine": "Chinese",
  "address": "...",
  "rating": 4.5,
  "dishPhoto": "data:image/png;base64,...",
  "createdAt": "2026-09-01T00:00:00.000Z",
  "updatedAt": "2026-09-09T00:00:00.000Z"
}
```

## Schema changes

> Any migrations you added (`002_*.sql`, ...), new tables or columns, and
> anything a reviewer needs to run beyond `./setup.sh`. Write "none" if there
> were none.

## How I verified this

> How you checked your work - the happy paths _and_ the failures. `curl`
> commands, a Postman collection, a scratch script, screenshots: whatever you
> actually used. Paste the commands.
>
> This is much faster for us to review than working it out ourselves, and it's
> how you show you checked the edge cases.

**Part A** - the contract table in CHALLENGE.md, every row including the error
cases:

```bash
# e.g.
curl -i http://localhost:3000/api/restaurants          # 200 + array
curl -i http://localhost:3000/api/restaurants/99999    # 404
curl -i http://localhost:3000/api/restaurants/abc      # 404
curl -i -X POST http://localhost:3000/api/restaurants \
  -H 'Content-Type: application/json' \
  -d '{"name":"Out Of Range","rating":6}'              # 400
```

**Part B** - the equivalent cases for what you built:

```bash

```

## Known issues / what I'd do next

> Anything broken, unfinished, or that you know is wrong. Being upfront here
> costs you nothing and tells us a lot.
