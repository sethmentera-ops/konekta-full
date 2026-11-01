/**
 * APK compilation & Python backend helper files generator.
 * Provides ready-to-use Python (Flask/FastAPI/Kivy Buildozer) and Capacitor configs
 * for building the Android .apk.
 */

export const PYTHON_FLASK_BACKEND = `"""
Konekta Python Flask + SQLite Backend API
Mabilis at magaan na backend para sa Konekta Web at Android Hybrid App
"""

import sqlite3
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import os
import json

app = Flask(__name__, static_folder="dist", static_url_path="")
CORS(app)

DB_PATH = "konekta.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email_or_phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    # Posts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    # Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route("/")
def index():
    return send_from_directory("dist", "index.html")

@app.route("/api/users/login", methods=["POST"])
def login():
    data = request.json or {}
    ident = data.get("emailOrPhone", "").strip()
    pw = data.get("password", "")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email_or_phone = ? AND password = ?", (ident, pw))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        user_dict = dict(row)
        del user_dict["password"]
        return jsonify({"status": "success", "user": user_dict})
    return jsonify({"status": "error", "message": "Maling email/numero o password"}), 401

@app.route("/api/posts", methods=["GET", "POST"])
def handle_posts():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if request.method == "POST":
        data = request.json or {}
        post_id = f"post_{int(os.urandom(4).hex(), 16)}"
        cursor.execute(
            "INSERT INTO posts (id, user_id, content, image_url) VALUES (?, ?, ?, ?)",
            (post_id, data.get("userId"), data.get("content"), data.get("imageUrl"))
        )
        conn.commit()
        conn.close()
        return jsonify({"status": "created", "postId": post_id})
    else:
        cursor.execute("""
            SELECT posts.*, users.first_name, users.last_name, users.avatar 
            FROM posts 
            JOIN users ON posts.user_id = users.id 
            ORDER BY posts.created_at DESC
        """)
        rows = cursor.fetchall()
        posts = [dict(r) for r in rows]
        conn.close()
        return jsonify({"posts": posts})

if __name__ == "__main__":
    print("🚀 Tumatakbo ang Konekta Backend sa http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)
`;

export const PYTHON_KIVY_BUILDOZER_MAIN = `"""
Konekta Mobile App - Kivy / Android WebView Hybrid
I-compile gamit ang Buildozer para maging standalone Android APK
"""

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.utils import platform

if platform == 'android':
    from jnius import autoclass
    from android.runnable import run_on_ui_thread
    WebView = autoclass('android.webkit.WebView')
    WebViewClient = autoclass('android.webkit.WebViewClient')
    WebSettings = autoclass('android.webkit.WebSettings')
    activity = autoclass('org.kivy.android.PythonActivity').mActivity
else:
    run_on_ui_thread = lambda f: f

class KonektaApp(App):
    def build(self):
        self.title = 'Konekta Mobile'
        layout = BoxLayout(orientation='vertical')
        
        if platform == 'android':
            self.create_webview()
        else:
            from kivy.uix.label import Label
            layout.add_widget(Label(
                text='Konekta Native Wrapper\\nSa Android, maglo-load ito gamit ang native WebView.\\nPara i-test sa browser, buksan ang index.html',
                halign='center'
            ))
        return layout

    @run_on_ui_thread
    def create_webview(self):
        webview = WebView(activity)
        settings = webview.getSettings()
        settings.setJavaScriptEnabled(True)
        settings.setDomStorageEnabled(True)
        settings.setDatabaseEnabled(True)
        settings.setAllowFileAccess(True)
        settings.setCacheMode(WebSettings.LOAD_DEFAULT)
        
        # Gumamit ng offline local assets o hosted URL
        webview.setWebViewClient(WebViewClient())
        # Maaaring i-point sa online app URL o local file:///android_asset/dist/index.html
        webview.loadUrl('https://ais-pre-j7bzeabk6jlhb26gnkqrj2-983044979099.asia-southeast1.run.app')
        activity.setContentView(webview)

if __name__ == '__main__':
    KonektaApp().run()
`;

export const BUILDOZER_SPEC = `[app]
# (str) Pamagat ng iyong aplikasyon
title = Konekta

# (str) Pangalan ng package
package.name = konekta

# (str) Domain ng package (kadalasan ay baligtad na domain name)
package.domain = ph.konekta.app

# (str) Directory ng source code
source.dir = .

# (list) Mga file extension na isasama sa package
source.include_exts = py,png,jpg,kv,atlas,html,js,css,json

# (str) Bersyon ng App
version = 1.0.0

# (list) Mga kailangang library (Python packages)
requirements = python3,kivy,pyjnius

# (str) Orientation ng screen (portrait, sensorPortrait, all)
orientation = portrait

# (bool) Fullscreen display
fullscreen = 0

# (list) Permissions ng Android (Internet access at network status)
android.permissions = INTERNET,ACCESS_NETWORK_STATE,WRITE_EXTERNAL_STORAGE,READ_EXTERNAL_STORAGE

# (int) Target Android API
android.api = 34
android.minapi = 24
android.ndk = 25b

# (str) Android entry point
android.entrypoint = org.kivy.android.PythonActivity

[buildozer]
# (int) Log level (0 = error lang, 1 = info, 2 = debug)
log_level = 2
warn_on_root = 1
`;

export const CAPACITOR_CONFIG = `{
  "appId": "ph.konekta.lite",
  "appName": "Konekta",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 1500,
      "backgroundColor": "#1877f2"
    },
    "Network": {
      "statusBarStyle": "light"
    }
  },
  "server": {
    "androidScheme": "https"
  }
}
`;

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
