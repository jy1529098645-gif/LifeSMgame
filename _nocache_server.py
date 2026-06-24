"""No-cache static dev server for the prototype.
Plain `python -m http.server` only sends Last-Modified (no Cache-Control), so browsers
cache the .js files heuristically and never revalidate -> edits don't show up without a
hard refresh. This server forces no-store so every reload fetches fresh code.

Usage: python _nocache_server.py <port> <directory>
"""
import http.server
import socketserver
import sys
import os
import functools

# 优先用预览器注入的 PORT 环境变量（autoPort），否则回退到命令行参数 / 8123
port = int(os.environ.get("PORT") or (sys.argv[1] if len(sys.argv) > 1 else 8123))
directory = sys.argv[2] if len(sys.argv) > 2 else "."


IMG_EXT = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".woff", ".woff2", ".ttf")


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        path = (self.path or "").split("?")[0].lower()
        if path.endswith(IMG_EXT):
            # 图片/字体允许缓存——否则每次重渲染都会重新下载，页面会闪一下
            self.send_header("Cache-Control", "public, max-age=86400")
        else:
            # 代码(html/js/css)永不缓存，改完刷新即生效
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, *args):
        pass  # quiet


# 多线程服务：页面要并发拉 ~60 个脚本，单线程会卡死/连接被拒（旧 bug）
class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


handler = functools.partial(NoCacheHandler, directory=directory)
with ThreadingServer(("", port), handler) as httpd:
    print("[no-cache dev server] http://localhost:%d  serving %s" % (port, directory))
    httpd.serve_forever()
