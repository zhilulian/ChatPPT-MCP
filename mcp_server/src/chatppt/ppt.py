"""
Chatppt MCP Server
"""
import os

import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import Field

# 创建MCP服务器实例
mcp = FastMCP("Chatppt Server", log_level="ERROR")
# Chatppt API Base URL
API_BASE = "https://saas.api.yoo-ai.com"
# 用户API Key
API_KEY = os.getenv('API_KEY')


def check_api_key():
    """检查 API_KEY 是否已设置"""
    if not API_KEY:
        raise ValueError("API_KEY 环境变量未设置")
    return API_KEY


@mcp.tool()
async def check():
    """查询用户当前配置token"""
    return os.getenv('API_KEY')


# 注册工具的装饰器，可以很方便的把一个函数注册为工具
@mcp.tool()
async def query_ppt(ppt_id: str = Field(description="PPT-ID")) -> str:
    """
    Name:
        查询PPT生成进度
    Description:
        根据PPT任务ID查询异步生成结果，status=1表示还在生成中，应该继续轮训该查询，status=2表示成功，status=3表示失败；process_url表示预览的url地址;
        当成功后使用默认浏览器打开ppt地址并下载PPT和生成编辑器地址；
        每次显示新增的图片不与上次请求的显示重复;
        每隔5秒轮训一次;
    Args:
        ppt_id: PPT-ID
    Returns:
        PPT信息的描述
    """

    try:
        url = API_BASE + '/apps/ppt-result'
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params={'id': ppt_id},
                                        headers={'Authorization': 'Bearer ' + API_KEY})
            return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e


@mcp.tool()
async def build_ppt(
        text: str = Field(description="描述生成文本"),
) -> str:
    """
    Name:
        PPT生成。当用户需要生成PPT时，调用此工具
    Description:
        根据描述的文本或markdown，执行生成任务。当返回PPT-ID时，表示生成任务成功，可以调用query_ppt工具查询生成进度
    Args:
        text: 输入描述的文本或markdown，生成PPT
    Returns:
        PPT-ID
    """

    try:
        api_key = check_api_key()
        url = API_BASE + '/apps/ppt-create'
        response = httpx.post(url,
                              data={'text': text},
                              headers={'Authorization': f'Bearer {api_key}'})

        if response.status_code != 200:
            raise Exception(f"API请求失败: HTTP {response.status_code}")

        return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"HTTP请求失败: {str(e)}") from e
    except ValueError as e:
        raise Exception(str(e)) from e
    except Exception as e:
        raise Exception(f"PPT生成失败: {str(e)}") from e


@mcp.tool()
async def replace_template_ppt(ppt_id: str = Field(description="PPT-ID")) -> str:
    """
    Name:
        替换模板
    Description:
        根据PPT-ID执行替换模板
    Args:
        ppt_id: PPT-ID
    Returns:
        新的PPT-ID
    """

    try:
        url = API_BASE + '/apps/ppt-create-task'
        response = httpx.post(url, data={'id': ppt_id}, headers={'Authorization': 'Bearer ' + API_KEY})
        return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e


@mcp.tool()
async def download_ppt(
        ppt_id: str = Field(description="PPT-ID")
) -> str:
    """
    Name:
        当PPT生成完成后，下载PPT。
    Description:
        生成 PPT 下载地址
    Args:
        ppt_id: PPT-ID
    Returns:
        PPT下载地址URL
    """

    try:
        url = API_BASE + '/apps/ppt-download'
        response = httpx.get(url, params={'id': ppt_id}, headers={'Authorization': 'Bearer ' + API_KEY})
        return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e


@mcp.tool()
async def editor_ppt(
        ppt_id: str = Field(description="PPT-ID")
) -> str:
    """
    Name:
        生成PPT编辑器界面URL
    Description:
        通过PPT-ID生成PPT编辑器界面URL
    Args:
        ppt_id: PPT-ID
    Returns:
        PPT编辑器地址URL
    """

    try:
        url = API_BASE + '/apps/ppt-editor'
        response = httpx.post(url, data={'id': ppt_id}, headers={'Authorization': 'Bearer ' + API_KEY})
        return response.json()
    except httpx.HTTPError as e:
        raise Exception(f"HTTP request failed: {str(e)}") from e
