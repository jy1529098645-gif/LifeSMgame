#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
创业人生模拟器 —— 部署用静态服务器（Railway / 任何 PaaS 通用）
把 prototype/ 目录作为网站根目录提供，带 no-cache 头（保证玩家永远拿到最新版本）。
监听 0.0.0.0:$PORT（Railway 会注入 PORT 环境变量；本地默认 8080）。
纯 Python 标准库，无第三方依赖。
"""
import http.server
import socketserver
import os

PORT = int(os.environ.get("PORT", "8080"))
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prototype")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        # 禁缓存：每次都加载最新 JS/CSS，避免玩家卡在旧版本
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # 安静日志


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with ReusableTCPServer(("0.0.0.0", PORT), Handler) as httpd:
        print(f"创业人生模拟器 running on 0.0.0.0:{PORT}  (root={ROOT})", flush=True)
        httpd.serve_forever()
