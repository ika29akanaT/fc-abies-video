/* ======================================================
   FC Abies（2026年 C Team）
   VIDEO LIBRARY
   script.js / Version 1
====================================================== */


/* ======================================================
   仮の動画データ
   -----------------------------------------------
   次の回でGoogleスプレッドシートから
   自動取得する仕組みに変更します。
====================================================== */

const videos = [

    {
        date: "2026/07/27",
        category: "南信リーグ3部 第3節",
        opponent: "エアフォルク長野",
        venue: "菅平80番グラウンド",
        youtube: "https://www.youtube.com/watch?v=XXXXXXXXXXX"
    },

    {
        date: "2026/07/13",
        category: "南信リーグ3部 第2節",
        opponent: "NexWayB",
        venue: "岡谷北部中学校",
        youtube: "https://www.youtube.com/watch?v=YYYYYYYYYYY"
    },

    {
        date: "2026/07/10",
        category: "南信リーグ3部 第1節",
        opponent: "箕輪・辰野B",
        venue: "川路多目的広場",
        youtube: "https://www.youtube.com/watch?v=ZZZZZZZZZZZ"
    }

];


/* ======================================================
   YouTube URLから動画IDを取得
====================================================== */

function getYoutubeId(url) {

    if (!url) {
        return "";
    }

    const patterns = [

        /youtube\.com\/watch\?v=([^&]+)/,

        /youtu\.be\/([^?]+)/,

        /youtube\.com\/embed\/([^?]+)/,

        /youtube\.com\/shorts\/([^?]+)/

    ];

    for (const pattern of patterns) {

        const match = url.match(pattern);

        if (match) {

            return match[1];

        }

    }

    return "";

}


/* ======================================================
   YouTubeサムネイルURLを作成
====================================================== */

function getThumbnail(videoId) {

    if (!videoId) {

        return "";

    }

    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

}


/* ======================================================
   動画カードを作成
====================================================== */

function createVideoCard(video) {

    const videoId = getYoutubeId(video.youtube);

    const thumbnail = getThumbnail(videoId);

    return `

        <article class="video-card">

            <a
                href="${video.youtube}"
                target="_blank"
                rel="noopener noreferrer"
                class="video-link"
            >

                <div class="thumbnail">

                    <img
                        src="${thumbnail}"
                        alt="${video.category} vs ${video.opponent}"
                        loading="lazy"
                    >

                    <div class="play-button">
                        ▶
                    </div>

                    <div class="video-category">
                        ${video.category}
                    </div>

                </div>

            </a>


            <div class="video-info">

                <h3>
                    ${video.category}
                </h3>

                <p class="video-opponent">
                    ⚽ vs ${video.opponent}
                </p>

                <div class="video-meta">

                    <span>
                        📅 ${video.date}
                    </span>

                    <span>
                        📍 ${video.venue}
                    </span>

                </div>


                <a
                    href="${video.youtube}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="watch-btn"
                >
                    ▶ 動画を見る
                </a>

            </div>

        </article>

    `;

}


/* ======================================================
   最新動画を表示
====================================================== */

function displayLatestVideo() {

    const container =
        document.getElementById("latestVideo");

    if (!container) {

        return;

    }

    if (videos.length === 0) {

        container.innerHTML = `

            <div class="no-results">

                <strong>動画がありません</strong>

                現在登録されている動画はありません。

            </div>

        `;

        return;

    }

    container.innerHTML =
        createVideoCard(videos[0]);

}


/* ======================================================
   動画一覧を表示
====================================================== */

function displayVideos(videoData) {

    const container =
        document.getElementById("videoList");

    if (!container) {

        return;

    }


    if (videoData.length === 0) {

        container.innerHTML = `

            <div class="no-results">

                <strong>動画が見つかりません</strong>

                検索条件を変更してください。

            </div>

        `;

        return;

    }


    container.innerHTML =
        videoData
            .map(video => createVideoCard(video))
            .join("");

}


/* ======================================================
   検索
====================================================== */

function searchVideos(keyword) {

    const searchKeyword =
        keyword.trim().toLowerCase();


    if (!searchKeyword) {

        displayVideos(videos);

        return;

    }


    const results =
        videos.filter(video => {

            const text = `

                ${video.date}
                ${video.category}
                ${video.opponent}
                ${video.venue}

            `.toLowerCase();


            return text.includes(searchKeyword);

        });


    displayVideos(results);

}


/* ======================================================
   検索ボックス
====================================================== */

function setupSearch() {

    const searchBox =
        document.getElementById("search");


    if (!searchBox) {

        return;

    }


    searchBox.addEventListener(
        "input",
        function () {

            searchVideos(this.value);

        }
    );

}


/* ======================================================
   初期表示
====================================================== */

function initialize() {

    displayLatestVideo();

    displayVideos(videos);

    setupSearch();

}


/* ======================================================
   ページ読み込み完了
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
