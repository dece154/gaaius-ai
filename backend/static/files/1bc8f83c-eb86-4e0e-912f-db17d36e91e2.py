```python
def hello_world(name: str = "World") -> None:
    """
    Prints a hello message to the console.

    Args:
        name (str): The name to include in the hello message. Defaults to "World".
    """
    print(f"Hello, {name}!")


if __name__ == "__main__":
    hello_world()
    hello_world("Alice")
```