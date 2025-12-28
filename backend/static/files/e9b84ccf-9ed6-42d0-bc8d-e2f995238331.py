def hello_world(name: str = "World") -> None:
    """
    Prints a greeting message to the console.

    Args:
        name (str): The name to be used in the greeting. Defaults to "World".
    """
    print(f"Hello, {name}!")

# Example usage:
if __name__ == "__main__":
    hello_world()
    hello_world("Alice")