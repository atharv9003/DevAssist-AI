This document provides a comprehensive overview and usage guide for the `sample_service` Python module.

---

# `sample_service` Module Documentation

## Module Overview

The `sample_service` module provides functionalities for calculating transit fares based on various criteria and managing a transit card's balance and transaction history. It includes a function for fare calculation and a class for transit card management, making it suitable for applications requiring basic public transport fare logic and card operations.

## Functions

### `calculate_transit_fare(distance_km: float, passenger_type: str, is_peak_hour: bool) -> float`

Calculates the total fare for a transit journey based on various factors.

The fare calculation includes a base rate, an additional charge for distances over 10 km, discounts for specific passenger types, and a surcharge for peak hours. The final fare is rounded to two decimal places.

**Parameters:**

*   `distance_km` (`float`): The distance of the journey in kilometers. Must be non-negative.
*   `passenger_type` (`str`): The type of passenger. Valid values are "student", "senior", or any other string for a regular passenger.
*   `is_peak_hour` (`bool`): `True` if the journey occurs during peak hours, `False` otherwise.

**Returns:**

*   `float`: The calculated transit fare, rounded to two decimal places.

## Classes

### `class TransitCardManager`

Manages the balance and transaction history of a single transit card.

This class provides methods to top up the card's balance, deduct fares, and maintain a record of all transactions.

**Attributes:**

*   `balance` (`float`): The current monetary balance on the transit card.
*   `history` (`list[dict]`): A chronological list of all transactions performed on the card. Each entry is a dictionary with `"type"` (e.g., `"top_up"`, `"fare_deduction"`) and `"amount"` keys.

#### `__init__(self, initial_balance: float = 0.0)`

Initializes a new `TransitCardManager` instance.

**Parameters:**

*   `initial_balance` (`float`, optional): The starting balance for the transit card. Defaults to `0.0`.

#### `top_up(self, amount: float) -> float`

Adds a specified amount to the transit card's balance.

Records the top-up as a transaction in the card's history.

**Parameters:**

*   `amount` (`float`): The amount to add to the balance. Must be a positive number.

**Returns:**

*   `float`: The new balance of the transit card after the top-up.

**Raises:**

*   `ValueError`: If the `amount` is not positive.

#### `deduct_fare(self, fare: float) -> float`

Deducts a specified fare amount from the transit card's balance.

Records the fare deduction as a transaction in the card's history.

**Parameters:**

*   `fare` (`float`): The fare amount to deduct. Must be a positive number.

**Returns:**

*   `float`: The new balance of the transit card after the deduction.

**Raises:**

*   `ValueError`: If the current balance is insufficient to cover the `fare`.

## Usage Examples

Here are a few examples demonstrating how to use the `sample_service` module.

### Example 1: Calculating Transit Fares

This example shows how to calculate fares for different scenarios using the `calculate_transit_fare` function.

```python
from sample_service import calculate_transit_fare

# Regular passenger, short distance, non-peak hour
fare1 = calculate_transit_fare(distance_km=5, passenger_type="regular", is_peak_hour=False)
print(f"Fare for 5km, regular, non-peak: ${fare1:.2f}")

# Student passenger, long distance, peak hour
fare2 = calculate_transit_fare(distance_km=15, passenger_type="student", is_peak_hour=True)
print(f"Fare for 15km, student, peak: ${fare2:.2f}")

# Senior passenger, medium distance, non-peak hour
fare3 = calculate_transit_fare(distance_km=12, passenger_type="senior", is_peak_hour=False)
print(f"Fare for 12km, senior, non-peak: ${fare3:.2f}")

# Regular passenger, long distance, peak hour
fare4 = calculate_transit_fare(distance_km=20, passenger_type="regular", is_peak_hour=True)
print(f"Fare for 20km, regular, peak: ${fare4:.2f}")
```

### Example 2: Managing a Transit Card

This example demonstrates topping up a `TransitCardManager` and deducting fares.

```python
from sample_service import TransitCardManager

# Initialize a new transit card
my_card = TransitCardManager(initial_balance=10.0)
print(f"Initial balance: ${my_card.balance:.2f}")

# Top up the card
my_card.top_up(20.0)
print(f"Balance after top-up: ${my_card.balance:.2f}")

# Deduct a fare
try:
    my_card.deduct_fare(3.50)
    print(f"Balance after first fare: ${my_card.balance:.2f}")
except ValueError as e:
    print(f"Error deducting fare: {e}")

# Attempt to deduct a fare that exceeds the balance
try:
    my_card.deduct_fare(30.00)
except ValueError as e:
    print(f"Error deducting large fare: {e}")

print(f"Final balance: ${my_card.balance:.2f}")
print("Transaction history:", my_card.history)
```

### Example 3: Integrated Fare Calculation and Card Deduction

This example combines fare calculation with the transit card management, simulating a real-world journey.

```python
from sample_service import calculate_transit_fare, TransitCardManager

# Create a transit card with some initial balance
card = TransitCardManager(initial_balance=15.0)
print(f"Card balance before journey: ${card.balance:.2f}")

# Scenario 1: Regular journey
journey1_distance = 8.0
journey1_passenger = "regular"
journey1_peak = False
fare1 = calculate_transit_fare(journey1_distance, journey1_passenger, journey1_peak)
print(f"\nCalculated fare for journey 1 ({journey1_distance}km, {journey1_passenger}, peak={journey1_peak}): ${fare1:.2f}")

try:
    card.deduct_fare(fare1)
    print(f"Card balance after journey 1: ${card.balance:.2f}")
except ValueError as e:
    print(f"Could not complete journey 1: {e}")

# Scenario 2: Student journey during peak hour
journey2_distance = 18.0
journey2_passenger = "student"
journey2_peak = True
fare2 = calculate_transit_fare(journey2_distance, journey2_passenger, journey2_peak)
print(f"\nCalculated fare for journey 2 ({journey2_distance}km, {journey2_passenger}, peak={journey2_peak}): ${fare2:.2f}")

try:
    card.deduct_fare(fare2)
    print(f"Card balance after journey 2: ${card.balance:.2f}")
except ValueError as e:
    print(f"Could not complete journey 2: {e}")
    # Top up if needed
    print("Topping up card...")
    card.top_up(25.0)
    print(f"Card balance after top-up: ${card.balance:.2f}")
    try:
        card.deduct_fare(fare2)
        print(f"Card balance after retrying journey 2: ${card.balance:.2f}")
    except ValueError as e_retry:
        print(f"Still could not complete journey 2 after top-up: {e_retry}")


print("\nFinal card balance:", f"${card.balance:.2f}")
print("Full transaction history:", card.history)
```