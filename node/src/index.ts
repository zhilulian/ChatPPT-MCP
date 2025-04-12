#!/usr/bin/env node
import {Server} from "@modelcontextprotocol/sdk/server/index.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

function getApiKey(): string {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable is not set");
        process.exit(1);
    }
    return "Bearer " + apiKey;
}

const API_KEY = getApiKey();
const API_URL = "https://saas.api.yoo-ai.com"


interface ChatpptResponse {
    code: number;
    msg: string;
}

interface PptBuildResponse extends ChatpptResponse {
    data: {
        id: string
    }
}

interface PptQueryResponse extends ChatpptResponse {
    data: {
        images_url: object,
        id: string,
        introduce: string,
        ppt_title: string,
        status: number,
        process_url: string,
        preview_url: string,
        state_description: string
    }
}


interface PptDownloadResponse extends ChatpptResponse {
    data: {
        download_url: string,
    }
}


interface EditorPptResponse extends ChatpptResponse {
    data: {
        url: string,
    }
}


// Tool definitions
const BUILD_TOOL: Tool = {
    name: "build_ppt",
    description: "根据描述的文本或markdown，执行生成任务。当返回PPT-ID时，表示生成任务成功，可以调用query_ppt工具查询生成进度",
    inputSchema: {
        type: "object",
        properties: {
            text: {
                type: "string",
                description: "输入描述的文本或markdown，生成PPT"
            }
        },
        required: ["text"]
    }
};

const QUERY_TOOL: Tool = {
    name: "query_ppt",
    description: "根据PPT任务ID查询异步生成结果，status=1表示还在生成中，应该继续轮训该查询，status=2表示成功，status=3表示失败；process_url表示预览的url地址，不断轮训请求直至成功或失败;\n" +
        "        当成功后使用默认浏览器打开ppt地址并下载PPT和生成编辑器地址；",
    inputSchema: {
        type: "object",
        properties: {
            ppt_id: {
                type: "string",
                description: "PPT-ID"
            }
        },
        required: ["ppt_id"]
    }
};

const DOWNLOAD_PPT_TOOL: Tool = {
    name: "download_ppt",
    description: "根据PPT任务ID生成 PPT 下载地址",
    inputSchema: {
        type: "object",
        properties: {
            id: {
                type: "string",
                description: "PPT-ID"
            }
        },
        required: ["id"]
    }
};

const EDITOR_PPT_TOOL: Tool = {
    name: "editor_ppt",
    description: "根据PPT任务ID生成PPT编辑器界面URL",
    inputSchema: {
        type: "object",
        properties: {
            id: {
                type: "string",
                description: "PPT-ID"
            }
        },
        required: ["id"]
    }
};


// 生成ppt
async function handlePptBuild(text: string) {
    const url = new URL(API_URL + "/apps/ppt-create");
    let params = JSON.stringify({
        "text": text,
    })
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": API_KEY
        },
        body: params,
    });
    const data = await response.json() as PptBuildResponse;
    if (data.code !== 200) {
        return {
            content: [{
                type: "text",
                text: `BuildPpt failed: ${data.code} : ${data.msg}`,
            }],
            isError: true
        };
    }

    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                id: data.data.id,
            }, null, 2)
        }],
        isError: false
    };
}


// 查询ppt
async function handleQuery(ppt_id: string) {
    const url = new URL(API_URL + "/apps/ppt-result");
    url.searchParams.append("id", ppt_id);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": API_KEY
        }
    });
    const data = await response.json() as PptQueryResponse;
    if (data.code !== 200) {
        return {
            content: [{
                type: "text",
                text: `Ppt failed: ${data.code} : ${data.msg}`,
            }],
            isError: true
        };
    }

    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                id: data.data.id,
                images_url: data.data.images_url,
                introduce: data.data.introduce,
                ppt_title: data.data.ppt_title,
                status: data.data.status,
                process_url: data.data.process_url,
                preview_url: data.data.preview_url,
                state_description: data.data.state_description,
            }, null, 2)
        }],
        isError: false
    };
}


// 下载ppt
async function handleDownloadPpt(id: string) {
    const url = new URL(API_URL + "/apps/ppt-download");
    url.searchParams.append("id", id);

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": API_KEY
        }
    });
    const data = await response.json() as PptDownloadResponse;
    if (data.code !== 200) {
        return {
            content: [{
                type: "text",
                text: `Ppt failed: ${data.code} : ${data.msg}`,
            }],
            isError: true
        };
    }

    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                download_url: data.data.download_url,
            }, null, 2)
        }],
        isError: false
    };
}


// 编辑器ppt
async function handleEditorPpt(id: string) {
    const url = new URL(API_URL + "/apps/ppt-editor");
    let params = JSON.stringify({
        "id": id,
    })

    const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": API_KEY
        },
        body: params,
    });
    const data = await response.json() as EditorPptResponse;
    if (data.code !== 200) {
        return {
            content: [{
                type: "text",
                text: `Ppt failed: ${data.code} : ${data.msg}`,
            }],
            isError: true
        };
    }

    return {
        content: [{
            type: "text",
            text: JSON.stringify({
                url: data.data.url,
            }, null, 2)
        }],
        isError: false
    };
}

// Create an MCP server
const server = new Server(
    {
        name: "mcp-server/chatppt",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    },
);

const MAPS_TOOLS = [
    BUILD_TOOL,
    QUERY_TOOL,
    DOWNLOAD_PPT_TOOL,
    EDITOR_PPT_TOOL
] as const;

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MAPS_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        switch (request.params.name) {
            case "build_ppt": {
                const {text} = request.params.arguments as { text: string };
                return await handlePptBuild(text);
            }

            case "query_ppt": {
                const {ppt_id} = request.params.arguments as { ppt_id: string };
                return await handleQuery(ppt_id);
            }

            case "download_ppt": {
                const {id} = request.params.arguments as { id: string };
                return await handleDownloadPpt(id);
            }

            case "editor_ppt": {
                const {id} = request.params.arguments as { id: string };
                return await handleEditorPpt(id);
            }

            default:
                return {
                    content: [{
                        type: "text",
                        text: `Unknown tool: ${request.params.name}`
                    }],
                    isError: true
                };
        }
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
});


async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Chatppt MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});