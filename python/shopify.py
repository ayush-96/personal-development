import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import re

# ── Product data extracted from template ──────────────────────────────────────
products_raw = [
    {"name": "Chocolate A5 Notebook", "variants": [], "category": "Stationery > Notebooks", "type": "Notebook"},
    {"name": "Hand fan", "variants": ["Blue", "Pink", "Purple", "Yellow"], "category": "Accessories", "type": "Fan"},
    {"name": "Soap tubes", "variants": ["Green", "Blue", "White", "Pink", "Yellow", "Purple"], "category": "Accessories", "type": "Soap"},
    {"name": "Glue stick", "variants": [], "category": "Stationery > Craft Supplies", "type": "Craft Supply"},
    {"name": "Lego Sharpeners", "variants": ["Toucan", "Elephant", "Giraffe", "Space Craft", "Truck", "Lion", "Crane Truck", "Bulldozer", "Bull"], "category": "Stationery > Sharpeners", "type": "Sharpener"},
    {"name": "Chocolate Notebook", "variants": [], "category": "Stationery > Notebooks", "type": "Notebook"},
    {"name": "Biscuit Notebook", "variants": [], "category": "Stationery > Notebooks", "type": "Notebook"},
    {"name": "Capybara Stationery Set", "variants": [], "category": "Stationery > Sets", "type": "Stationery Set"},
    {"name": "A5 Size Notebooks", "variants": ["Avocado", "Teddy Pink", "Teddy Blue", "Purple Planet", "Red Planet"], "category": "Stationery > Notebooks", "type": "Notebook"},
    {"name": "Long Magnetic Notepad + Pencil", "variants": ["Panda", "Grape", "Lemon"], "category": "Stationery > Notepads", "type": "Notepad"},
    {"name": "Kawaii Bandaids", "variants": ["New Season", "Fruit", "Unicorn", "Dino"], "category": "Accessories", "type": "Bandaid"},
    {"name": "Puffy Stickers", "variants": ["Ghost", "Cat", "Unicorn", "Space", "Panda"], "category": "Stationery > Stickers", "type": "Sticker"},
    {"name": "Notepad with Pen", "variants": ["Hulk", "Ironman", "Pink Cat", "Kuromi", "Lovely", "Purple Cat", "Green Cat", "Blue Cat", "Yellow Cat"], "category": "Stationery > Notepads", "type": "Notepad"},
    {"name": "Pocket Notebooks", "variants": ["Sanrio", "Spiderman", "Galaxy", "Marvel", "Teddy"], "category": "Stationery > Notebooks", "type": "Notebook"},
    {"name": "Clickable Erasers", "variants": ["Dino Green", "Brown Teddy", "Brown Capybara", "Panda Green", "Pink My Melody", "Blue", "Purple Cute Baby", "Yellow Duck", "Pink Unicorn", "Purple"], "category": "Stationery > Erasers", "type": "Eraser"},
    {"name": "Double Head Markers", "variants": [], "category": "Stationery > Markers", "type": "Marker"},
    {"name": "Kawaii Lock", "variants": [], "category": "Accessories", "type": "Lock"},
    {"name": "Stapler Set with Pins", "variants": ["Pink", "Purple", "White", "Blue"], "category": "Stationery > Office Supplies", "type": "Stapler"},
    {"name": "Fries Snack Clips", "variants": [], "category": "Accessories", "type": "Clip"},
    {"name": "Sticky Note Label Rolls", "variants": ["Chubby Panda", "Capybara", "Panda Green", "Panda Pink", "Panda Purple", "Panda Blue", "My Melody Pink", "Kuromi Blue", "Kuromi Purple"], "category": "Stationery > Sticky Notes", "type": "Sticky Note"},
    {"name": "Sticky Notes Shapes Set", "variants": ["Kitty", "Rectangle + Heart"], "category": "Stationery > Sticky Notes", "type": "Sticky Note"},
    {"name": "Capybara Sticky Notes", "variants": ["Capybara Flower", "Capybara Apples", "Capybara On Top", "Capybara Paper", "Hi", "I'm Fine", "Bear", "Cat"], "category": "Stationery > Sticky Notes", "type": "Sticky Note"},
    {"name": "Fidget Spinner", "variants": ["Yellow", "Pink", "Red", "Green"], "category": "Toys & Games", "type": "Fidget Toy"},
    {"name": "Correction Tape", "variants": ["Yellow", "Blue", "Green"], "category": "Stationery > Office Supplies", "type": "Correction Tape"},
    {"name": "Kawaii Highlighters", "variants": ["Candy", "Ice Cream", "Pet Paw", "Teddy", "Marvel", "Kawaii", "Mushroom", "Unicorn", "Carrot", "Test Tubes"], "category": "Stationery > Markers", "type": "Highlighter"},
    {"name": "Astronaut Pencil Set", "variants": [], "category": "Stationery > Pencils", "type": "Pencil Set"},
    {"name": "Kawaii Skipping Rope", "variants": [], "category": "Toys & Games", "type": "Toy"},
    {"name": "Fluorescent Pencils Marvel Edition", "variants": [], "category": "Stationery > Pencils", "type": "Pencil Set"},
    {"name": "Kawaii Wet Wipes", "variants": ["Fish", "Unicorn White", "Unicorn Blue", "Dino Yellow", "Dino Blue", "Peppa Pig", "Starry Night Black", "Dino Green", "Unicorn Pink", "Starry Night Blue", "Astronaut Blue", "Astronaut Peach"], "category": "Accessories", "type": "Wet Wipes"},
    {"name": "Character Pen Pencils", "variants": ["Pikachu", "Spiderman", "Ironman"], "category": "Stationery > Pencils", "type": "Pen Pencil"},
    {"name": "Contact Lens Case", "variants": [], "category": "Accessories", "type": "Case"},
    {"name": "Kawaii Pens", "variants": ["Tennis Ball", "Watermelon", "Avocado", "Pizza", "Astronaut"], "category": "Stationery > Pens", "type": "Pen"},
    {"name": "Giraffe Pens", "variants": ["Yellow", "Black & White", "Green"], "category": "Stationery > Pens", "type": "Pen"},
    {"name": "Chocolate Erasers", "variants": [], "category": "Stationery > Erasers", "type": "Eraser"},
    {"name": "Kawaii Sharpeners", "variants": ["Dino", "Batman", "Unicorn Blue", "Unicorn Pink", "Astronaut Blue", "Toast", "Paw Yellow", "Paw Pink", "Teddy", "Kuromi", "Unicorn White"], "category": "Stationery > Sharpeners", "type": "Sharpener"},
    {"name": "Bookmark Clips", "variants": ["Panda", "Marvel"], "category": "Stationery > Bookmarks", "type": "Bookmark"},
    {"name": "Packet Wet Wipes", "variants": ["Peach", "Pink", "Yellow", "Blue", "Green", "Panda", "Purple Kuromi"], "category": "Accessories", "type": "Wet Wipes"},
    {"name": "Tic Tac Toe Game", "variants": ["Black", "Blue"], "category": "Toys & Games", "type": "Board Game"},
    {"name": "Kawaii Writing Pad", "variants": ["Clear Duck", "Sanrio Blue", "Pink Cupcake"], "category": "Stationery > Notepads", "type": "Writing Pad"},
    {"name": "Uno Cards", "variants": [], "category": "Toys & Games", "type": "Card Game"},
    {"name": "Character Keychains", "variants": ["Minion", "Spongebob", "Hulk", "DragonBallZ Red", "Mario", "Ironman", "Astronaut", "Sneakers", "Thor", "Starbucks", "Pikachu", "DBZ Green", "DBZ Blue", "Panda", "Miles Spiderman", "Tom", "Tom and Jerry", "Jerry", "Snoopy", "Naruto", "DBZ Yellow", "DBZ Black", "Basketball", "Mickey Mouse", "Captain America", "Christmas", "Labubu", "Doraemon", "Disney Princess", "Hello Kitty", "Sanrio Character"], "category": "Accessories > Keychains", "type": "Keychain"},
    {"name": "Kawaii Art Knife", "variants": [], "category": "Stationery > Craft Supplies", "type": "Art Knife"},
    {"name": "Tiny Fridge Notepads", "variants": ["Teddy", "Cupcake"], "category": "Stationery > Notepads", "type": "Notepad"},
    {"name": "4 Fold Stickers Pack Capybara", "variants": [], "category": "Stationery > Stickers", "type": "Sticker"},
    {"name": "Pink Slime", "variants": [], "category": "Toys & Games", "type": "Toy"},
    {"name": "Oreo Biscuit Notebook", "variants": [], "category": "Stationery > Notebooks", "type": "Notebook"},
    {"name": "Labubu Sequence Kit", "variants": ["Purple", "Blue"], "category": "Toys & Games", "type": "Toy"},
    {"name": "Wood Craft Frame", "variants": ["Red", "Blue", "Pink"], "category": "Stationery > Craft Supplies", "type": "Craft Supply"},
    {"name": "Tinned Markers Set", "variants": ["Blue Pack", "Yellow Pack"], "category": "Stationery > Markers", "type": "Marker Set"},
    {"name": "Labubu Coin Pouch", "variants": ["Pink", "Green"], "category": "Accessories", "type": "Coin Pouch"},
    {"name": "Head Rotator Figure", "variants": ["Snitch", "Capybara"], "category": "Toys & Games", "type": "Collectible"},
    {"name": "Floating Pen", "variants": [], "category": "Stationery > Pens", "type": "Pen"},
    {"name": "Wooden Piggy Bank", "variants": [], "category": "Accessories", "type": "Piggy Bank"},
]

# ── Description templates ──────────────────────────────────────────────────────
descriptions = {
    "Notebook": "Adorable kawaii-style notebook perfect for journaling, school notes, or everyday writing. Featuring cute character designs that make stationery fun and stylish. Smooth quality paper inside, compact size for easy carrying.",
    "Notepad": "Charming kawaii notepad for jotting down ideas, to-do lists, and reminders. Features delightful character artwork on the cover with quality ruled pages inside.",
    "Sticker": "Irresistibly cute kawaii stickers to decorate your notebooks, phone cases, water bottles, and more! Premium quality with easy peel-and-stick application.",
    "Eraser": "Super adorable kawaii-style eraser with fun character shapes. Erases cleanly without smudging — a must-have for cute desk setups!",
    "Sharpener": "Fun character-shaped sharpener that makes sharpening pencils a joy! Compact, sturdy, and perfect for kids and stationery lovers.",
    "Marker": "Vibrant, rich colour markers with kawaii-themed designs. Great for art, journaling, and creative projects. Long-lasting ink with a smooth flow.",
    "Highlighter": "Pastel-toned kawaii highlighters with adorable character designs. Perfect for students and stationery enthusiasts. Bright, smear-resistant ink.",
    "Pen": "Smooth-writing kawaii pen with an eye-catching character design. A fun twist on your everyday writing tool. Makes a great gift for stationery lovers!",
    "Pen Pencil": "Cute character-themed pen pencil hybrid — write and sketch with a kawaii flair! Great for school, work, and creative journaling.",
    "Pencil Set": "Delightful kawaii pencil set featuring fun character designs. Smooth graphite for easy writing and drawing. Packaged in a giftable set.",
    "Sticky Note": "Adorable kawaii sticky notes to brighten your desk, planner, or fridge! Peel-and-stick on any surface without damaging it. Pack includes multiple sheets.",
    "Correction Tape": "Kawaii correction tape with a cute character cover — because even fixing mistakes can be adorable! Easy-glide application for smooth corrections.",
    "Stapler": "Mini kawaii stapler set complete with staples. Perfectly sized for desks and on-the-go use. Comes in a delightful pastel colour.",
    "Keychain": "Collectible character keychain featuring your favourite pop-culture and kawaii icons. Durable resin or acrylic finish — great for bags, keys, and gifts.",
    "Stationery Set": "All-in-one kawaii stationery set packed with everything you need for a cute desk setup. Perfect as a gift for students and stationery lovers.",
    "Wet Wipes": "Pocket-sized wet wipes in a kawaii character packaging. Handy for on-the-go freshness. Gentle, skin-friendly formula.",
    "Bandaid": "Kawaii decorative bandaids that make boo-boos cuter! Fun character designs. Standard size, skin-safe adhesive.",
    "Bookmark": "Adorable kawaii bookmark clips to hold your page in style. Won't damage pages — perfect for books, planners, and journals.",
    "Fidget Toy": "Satisfying kawaii fidget spinner in a fun colour. Great for stress relief and focus. Compact and pocket-friendly.",
    "Board Game": "Classic Tic Tac Toe in a cute kawaii format! Great for two players, fun for all ages. Portable and reusable.",
    "Card Game": "Classic Uno card game — hours of fun with family and friends! Great kawaii gift idea for game nights.",
    "Collectible": "Adorable kawaii character collectible figure. A delightful addition to any desk, shelf, or bag. Makes a wonderful gift for pop-culture fans!",
    "Craft Supply": "Premium kawaii craft supply for creative projects. Great for art, DIY décor, and journaling. Compact and easy to use.",
    "Coin Pouch": "Kawaii character coin pouch — keep your change, earbuds, or small accessories safe in the cutest way! Zippered closure, portable size.",
    "Writing Pad": "Kawaii character writing pad for letters, notes, and journaling. Decorated pages make writing more fun and personal.",
    "Toy": "Fun kawaii-themed toy that sparks joy and creativity. Great for kids and collectors alike. Makes a wonderful gift!",
    "Marker Set": "Complete set of vibrant markers in a kawaii-designed tin. Perfect for illustration, journaling, and colouring. Great gift for creatives.",
    "Piggy Bank": "Charming wooden piggy bank for saving coins with a kawaii twist. A thoughtful gift for kids and kawaii fans alike.",
    "Art Knife": "Precision kawaii-designed art knife for cutting, crafting, and scrapbooking. Safety cap included. Ideal for DIY stationery projects.",
    "Lock": "Cute kawaii padlock — keep your diary or locker secure in style! Compact and lightweight with a secure locking mechanism.",
    "Fan": "Handheld kawaii-style fan perfect for warm days! Lightweight and foldable — a fun accessory to carry anywhere.",
    "Soap": "Kawaii-packaged soap tube in a cute colour. Gentle formula suitable for everyday use. Makes a delightful little gift!",
    "Clip": "Adorable kawaii chip clip shaped like fries — keep your snack bags sealed in the cutest way possible!",
    "Case": "Compact kawaii contact lens case with separate compartments for each lens. Easy to clean, travel-friendly size.",
    "Pen Pencil": "Mechanical pen pencil with a charming kawaii character design. Smooth writing, refillable, and lightweight.",
}

# ── Price & stock data ─────────────────────────────────────────────────────────
price_map = {
    "Notebook": (99, 249), "Notepad": (79, 199), "Sticker": (49, 129),
    "Eraser": (59, 149), "Sharpener": (69, 179), "Marker": (149, 349),
    "Highlighter": (99, 249), "Pen": (79, 199), "Pen Pencil": (89, 229),
    "Pencil Set": (149, 349), "Sticky Note": (79, 199), "Correction Tape": (89, 229),
    "Stapler": (149, 379), "Keychain": (99, 249), "Stationery Set": (299, 699),
    "Wet Wipes": (59, 149), "Bandaid": (79, 199), "Bookmark": (79, 199),
    "Fidget Toy": (99, 249), "Board Game": (199, 449), "Card Game": (249, 499),
    "Collectible": (149, 349), "Craft Supply": (99, 249), "Coin Pouch": (149, 349),
    "Writing Pad": (99, 249), "Toy": (149, 349), "Marker Set": (299, 649),
    "Piggy Bank": (299, 699), "Art Knife": (149, 349), "Lock": (129, 299),
    "Fan": (99, 249), "Soap": (79, 199), "Clip": (79, 199), "Case": (99, 249),
}

def get_price(ptype):
    return price_map.get(ptype, (99, 249))

# ── Build Shopify rows ──────────────────────────────────────────────────────────
# Shopify required columns
headers = [
    "Handle", "Title", "Body (HTML)", "Vendor", "Product Category",
    "Type", "Tags", "Published", "Option1 Name", "Option1 Value",
    "Variant SKU", "Variant Grams", "Variant Inventory Tracker",
    "Variant Inventory Qty", "Variant Inventory Policy",
    "Variant Fulfillment Service", "Variant Price", "Variant Compare At Price",
    "Variant Requires Shipping", "Variant Taxable",
    "Image Src", "Image Position", "Image Alt Text",
    "Gift Card", "SEO Title", "SEO Description",
    "Google Shopping / Google Product Category",
    "Variant Image", "Variant Weight Unit", "Status"
]

def make_handle(name):
    h = name.lower()
    h = re.sub(r"[^a-z0-9\s-]", "", h)
    h = re.sub(r"\s+", "-", h.strip())
    return h

def make_sku(name, variant, idx):
    prefix = "".join(w[0] for w in name.split()[:3]).upper()
    suffix = variant[:3].upper().replace(" ", "") if variant else "DEF"
    return f"KW-{prefix}-{suffix}-{idx:03d}"

def make_tags(name, ptype, category):
    tags = ["kawaii", "cute", "india", ptype.lower().replace(" ", "-")]
    if "Capybara" in name: tags.append("capybara")
    if "Panda" in name: tags.append("panda")
    if "Marvel" in name or "Ironman" in name or "Hulk" in name: tags.append("marvel")
    if "Labubu" in name: tags.append("labubu")
    if "Sanrio" in name or "Kuromi" in name or "Kitty" in name: tags.append("sanrio")
    if "Notebook" in name or "Notepad" in name: tags.append("stationery")
    tags.append(category.split(">")[0].strip().lower().replace(" ", "-"))
    return ", ".join(sorted(set(tags)))

rows = []
sku_counter = 1

for p in products_raw:
    name = p["name"]
    variants = p["variants"] if p["variants"] else [None]
    ptype = p["type"]
    category = p["category"]
    handle = make_handle(name)
    cost, price = get_price(ptype)
    compare_price = price + int(price * 0.2)
    desc_text = descriptions.get(ptype, "Adorable kawaii-style product. A delightful addition to any desk or gift collection!")
    body_html = f"<p>{desc_text}</p>"
    tags = make_tags(name, ptype, category)
    seo_title = f"{name} | Kawaii Stationery India"
    seo_desc = f"Buy {name} online in India. {desc_text[:120]}..."
    vendor = "Kawaii Corner"
    image_placeholder = f"https://placehold.co/800x800/FFE4F0/FF69B4?text={handle.replace('-', '+')}"

    has_variant = variants[0] is not None
    option_name = "Design" if has_variant else ""

    for i, variant in enumerate(variants):
        sku = make_sku(name, variant or "", sku_counter)
        sku_counter += 1
        option_val = variant if has_variant else ""

        row = {
            "Handle": handle,
            "Title": name if i == 0 else "",
            "Body (HTML)": body_html if i == 0 else "",
            "Vendor": vendor if i == 0 else "",
            "Product Category": category if i == 0 else "",
            "Type": ptype if i == 0 else "",
            "Tags": tags if i == 0 else "",
            "Published": "TRUE" if i == 0 else "",
            "Option1 Name": option_name if i == 0 else "",
            "Option1 Value": option_val,
            "Variant SKU": sku,
            "Variant Grams": 100,
            "Variant Inventory Tracker": "shopify",
            "Variant Inventory Qty": 50,
            "Variant Inventory Policy": "deny",
            "Variant Fulfillment Service": "manual",
            "Variant Price": price,
            "Variant Compare At Price": compare_price,
            "Variant Requires Shipping": "TRUE",
            "Variant Taxable": "TRUE",
            "Image Src": image_placeholder if i == 0 else "",
            "Image Position": 1 if i == 0 else "",
            "Image Alt Text": f"{name} - {variant}" if variant else name,
            "Gift Card": "FALSE" if i == 0 else "",
            "SEO Title": seo_title if i == 0 else "",
            "SEO Description": seo_desc if i == 0 else "",
            "Google Shopping / Google Product Category": "Arts & Entertainment > Party & Celebration > Gift Giving > Gifts" if i == 0 else "",
            "Variant Image": "",
            "Variant Weight Unit": "g",
            "Status": "active" if i == 0 else "",
        }
        rows.append(row)

print(f"Total rows generated: {len(rows)}")
print(f"Sample: {rows[0]}")

# Save to file for openpyxl
import json
with open("shopify_data.json", "w") as f:
    json.dump(rows, f)
print("Data saved.")
