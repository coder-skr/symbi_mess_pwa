import pdfplumber
import json
from datetime import datetime

def generate_menu_json(pdf_path, output_path="menu.json"):
    menu_data = {}

    print(f"Opening {pdf_path}...")

    with pdfplumber.open(pdf_path) as pdf:
        # Extract tables from the first page
        tables = pdf.pages[0].extract_tables()
        if not tables:
            print("No tables found in the PDF!")
            return

        # Flatten the table rows (in case the PDF reader splits them)
        all_rows = []
        for table in tables:
            for row in table:
                # Clean up newlines within cells
                cleaned_row = [str(cell).replace('\n', ' ').strip() if cell else "" for cell in row]
                all_rows.append(cleaned_row)

        # Locate the row containing the Days of the week
        day_row_idx = -1
        for i, row in enumerate(all_rows):
            if len(row) > 1 and "MONDAY" in row[1].upper():
                day_row_idx = i
                break

        if day_row_idx == -1:
            print("Error: Could not locate the 'MONDAY' column to anchor the table.")
            return

        # Extract Days and Dates
        days = all_rows[day_row_idx][1:8]
        dates = all_rows[day_row_idx + 1][1:8]

        # Initialize the JSON structure for the 7 days
        date_keys = []
        for i in range(7):
            if i < len(dates) and dates[i]:
                try:
                    # Convert DD/MM/YYYY to YYYY-MM-DD for the PWA logic
                    date_obj = datetime.strptime(dates[i], "%d/%m/%Y")
                    formatted_date = date_obj.strftime("%Y-%m-%d")
                except ValueError:
                    formatted_date = f"unknown-date-{i}"

                date_keys.append(formatted_date)
                menu_data[formatted_date] = {
                    "day": days[i].capitalize(),
                    "meals": {
                        "Breakfast": [],
                        "Lunch": [],
                        "Snacks": [],
                        "Dinner": []
                    }
                }

        # State tracker to know which meal section we are currently reading
        current_meal = None

        # Iterate through the food rows
        for row in all_rows[day_row_idx + 2:]:
            if not row or len(row) < 2:
                continue

            row_header = row[0].upper()

            # 1. Determine the current meal section based on keywords in the first column
            if "BREAK FAST" in row_header or "INDAIN" in row_header:
                current_meal = "Breakfast"
            elif "LUNCH" in row_header or ("VEG GRAVY" in row_header and current_meal in [None, "Breakfast"]):
                current_meal = "Lunch"
            elif "EVENING SNACKS" in row_header:
                current_meal = "Snacks"
            elif "DINNER" in row_header or "NON-VEG" in row_header or ("VEG GRAVY" in row_header and current_meal == "Snacks"):
                current_meal = "Dinner"

            # 2. Append the food items to the correct day and meal
            if current_meal:
                for day_idx in range(7):
                    # Ensure we don't go out of bounds
                    if day_idx + 1 < len(row):
                        item = row[day_idx + 1]

                        # Filter out structural data: empty strings, "NA", "N/A"
                        if item and item.upper() not in ["NA", "N/A", "N/A ", ""]:
                            # Clean up double spaces
                            clean_item = " ".join(item.split())
                            menu_data[date_keys[day_idx]]["meals"][current_meal].append(clean_item)

    # Overwrite the existing menu.json file with the new data
    with open(output_path, 'w') as f:
        json.dump(menu_data, f, indent=4)

    print(f"Success! {output_path} has been overwritten with the latest menu data.")

if __name__ == "__main__":
    # Ensure this matches the exact name of your downloaded PDF
    target_pdf = "menu.pdf"
    generate_menu_json(target_pdf)