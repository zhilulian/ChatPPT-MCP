# Chatppt MCP Server

MCP Server for the Chatppt API.

## Setup

### API Key
对应的API Key需要到[www.yoo-ai.com](https://www.yoo-ai.com)进行生成。
参考教程为：[教程链接](https://j2md2qa3ym.feishu.cn/docx/LRDrdv6PyoF472xMr7DcJSAUnye?from=from_copylink)
### Usage with Claude Desktop

Add the following to your `claude_desktop_config.json`:

### NPX

```json
{
  "mcpServers": {
    "baidu-map": {
      "command": "npx",
      "args": [
        "-y",
        "@chatppt/mcp-server-chatppt"
      ],
      "env": {
        "BAIDU_MAP_API_KEY": "<YOUR_API_KEY>"
      }
    }
  }
}
```

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.