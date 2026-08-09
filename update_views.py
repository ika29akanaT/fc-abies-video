import os
import csv
import io
import re
import requests


# ======================================================
# 設定
# ======================================================

YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]

SHEET_CSV_URL = (
    "https://docs.google.com/spreadsheets/d/e/"
    "2PACX-1vSAg5XxZ9ECrL0zHkKXQThb0Mzn77pFwuwohErBhuAxC5MkT2W6YXzPCctM0uNZZQ2HZnGjN2BVPrwX/"
    "pub?gid=1611060981&single=true&output=csv"
)

APPS_SCRIPT_URL = (
    "https://script.google.com/macros/s/"
    "AKfycbwNIiBG8RF7oYcVF3wGG7pQgpngiNE0Kqctm7ffNza18-9u_gI3SliPB-zqtcHgA1P7/"
    "exec"
)


# ======================================================
# YouTube URLから動画IDを取得
# ======================================================

def get_youtube_id(url):

    if not url:
        return ""

    patterns = [
        r"youtube\.com/watch\?v=([^&]+)",
        r"youtu\.be/([^?&]+)",
        r"youtube\.com/embed/([^?&]+)",
        r"youtube\.com/shorts/([^?&]+)"
    ]

    for pattern in patterns:

        match = re.search(pattern, url)

        if match:
            return match.group(1)

    return ""


# ======================================================
# スプレッドシートCSV取得
# ======================================================

def get_sheet_data():

    response = requests.get(
        SHEET_CSV_URL,
        timeout=30
    )

    response.raise_for_status()

    text = response.content.decode(
        "utf-8-sig"
    )

    return list(
        csv.DictReader(
            io.StringIO(text)
        )
    )


# ======================================================
# YouTube再生回数取得
# ======================================================

def get_view_counts(video_ids):

    if not video_ids:
        return {}

    results = {}

    # YouTube APIは最大50動画までまとめて取得
    for start in range(0, len(video_ids), 50):

        batch = video_ids[start:start + 50]

        response = requests.get(
            "https://www.googleapis.com/youtube/v3/videos",
            params={
                "part": "statistics",
                "id": ",".join(batch),
                "key": YOUTUBE_API_KEY
            },
            timeout=30
        )

        response.raise_for_status()

        data = response.json()

        for item in data.get("items", []):

            video_id = item["id"]

            statistics = item.get(
                "statistics",
                {}
            )

            view_count = statistics.get(
                "viewCount",
                "0"
            )

            results[video_id] = int(
                view_count
            )

    return results


# ======================================================
# Apps Scriptへ送信
# ======================================================

def send_to_apps_script(data):

    response = requests.post(
        APPS_SCRIPT_URL,
        json=data,
        timeout=30
    )

    response.raise_for_status()

    print(
        "Apps Script:",
        response.text
    )


# ======================================================
# メイン処理
# ======================================================

def main():

    print("スプレッドシートを取得しています...")

    rows = get_sheet_data()

    video_ids = []

    url_map = {}

    for row in rows:

        url = row.get(
            "動画URL",
            ""
        ).strip()

        video_id = get_youtube_id(url)

        if video_id:

            video_ids.append(
                video_id
            )

            url_map[video_id] = url

    # 重複削除
    video_ids = list(
        dict.fromkeys(video_ids)
    )

    print(
        f"{len(video_ids)}本の動画を確認します。"
    )

    if not video_ids:

        print(
            "動画URLが見つかりませんでした。"
        )

        return

    print(
        "YouTubeから再生回数を取得しています..."
    )

    view_counts = get_view_counts(
        video_ids
    )

    update_data = {}

    for video_id, view_count in view_counts.items():

        url = url_map[video_id]

        update_data[url] = view_count

        print(
            f"{url} → {view_count:,}回"
        )

    print(
        "Googleスプレッドシートを更新します..."
    )

    send_to_apps_script({
        "secret": "FC_ABIES_UPDATE_2026",
        "views": update_data
    })

    print(
        "再生回数の更新が完了しました！"
    )


# ======================================================
# 実行
# ======================================================

if __name__ == "__main__":
    main()
