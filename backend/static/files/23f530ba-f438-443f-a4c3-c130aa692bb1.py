def hello_world(name: str = "World") -> None:
    """
    Prints a personalized hello message.

    Args:
        name (str): The name to include in the greeting. Defaults to "World".
    """
    print(f"Hello, {name}!")

# Example usage:
if __name__ == "__main__":
    hello_world("Alice")
    hello_world()