import argparse
from ppt import mcp

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-t", "--transport",
        choices=["sse", "stdio"],
        default="stdio",
        help="Transport mode: sse or stdio"
    )
    args = parser.parse_args()
    mcp.run(transport=args.transport)

if __name__ == "__main__":
    main()
