def calculate_transit_fare(distance_km, passenger_type, is_peak_hour):
    """Calculates the total fare for a transit journey based on various factors.

    The fare calculation includes a base rate, an additional charge for distances
    over 10 km, discounts for specific passenger types, and a surcharge for peak hours.
    The final fare is rounded to two decimal places.

    Args:
        distance_km (float): The distance of the journey in kilometers. Must be non-negative.
        passenger_type (str): The type of passenger. Valid values are "student", "senior",
            or any other string for a regular passenger.
        is_peak_hour (bool): True if the journey occurs during peak hours, False otherwise.

    Returns:
        float: The calculated transit fare, rounded to two decimal places.
    """
    base_rate = 2.50
    if distance_km > 10:
        base_rate += (distance_km - 10) * 0.35
        
    discount = 0.0
    if passenger_type == "student":
        discount = 0.25
    elif passenger_type == "senior":
        discount = 0.50
        
    fare = base_rate * (1.0 - discount)
    
    if is_peak_hour:
        fare *= 1.15
        
    return round(fare, 2)


class TransitCardManager:
    """Manages the balance and transaction history of a single transit card.

    This class provides methods to top up the card's balance, deduct fares,
    and maintain a record of all transactions.

    Attributes:
        balance (float): The current monetary balance on the transit card.
        history (list[dict]): A chronological list of all transactions performed on the card.
            Each entry is a dictionary with "type" (e.g., "top_up", "fare_deduction")
            and "amount" keys.
    """
    def __init__(self, initial_balance=0.0):
        self.balance = initial_balance
        self.history = []

    def top_up(self, amount):
        """Adds a specified amount to the transit card's balance.

        Records the top-up as a transaction in the card's history.

        Args:
            amount (float): The amount to add to the balance. Must be a positive number.

        Returns:
            float: The new balance of the transit card after the top-up.

        Raises:
            ValueError: If the `amount` is not positive.
        """
        if amount <= 0:
            raise ValueError("Top up amount must be positive")
        self.balance += amount
        self.history.append({"type": "top_up", "amount": amount})
        return self.balance

    def deduct_fare(self, fare):
        """Deducts a specified fare amount from the transit card's balance.

        Records the fare deduction as a transaction in the card's history.

        Args:
            fare (float): The fare amount to deduct. Must be a positive number.

        Returns:
            float: The new balance of the transit card after the deduction.

        Raises:
            ValueError: If the current balance is insufficient to cover the `fare`.
        """
        if self.balance < fare:
            raise ValueError("Insufficient balance")
        self.balance -= fare
        self.history.append({"type": "fare_deduction", "amount": fare})
        return self.balance