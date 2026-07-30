/* ======================================================
   FC Abies（2026年 C Team）
   VIDEO LIBRARY
   Googleスプレッドシート連携版
====================================================== */


/* ======================================================
   Googleスプレッドシート CSV URL
====================================================== */

const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSAg5XxZ9ECrL0zHkKXQThb0Mzn77pFwuwohErBhuAxC5MkT2W6YXzPCctM0uNZZQ2HZnGjN2BVPrwX/pub?gid=1611060981&single=true&output=csv";


/* ======================================================
   CSVを取得
====================================================== */

async function loadVideos() {

    const container =
        document.getElementById("videoList");

    const latestContainer =
        document.getElementById("latestVideo");


    if (container) {

        container.innerHTML =
            '<div class="loading">動画データを読み込んでいます</div>';

    }


    try {

        const response =
            await fetch(SHEET_URL + "&t=" + Date.now());


        if (!response.ok) {

            throw new Error(
                "スプレッドシートを取得できませんでした"
            );

        }


        const csvText =
            await response.text();


        const videos =
            parseCSV(csvText);


        /* 日付の新しい順に並べる */

        videos.sort(function(a, b) {

            return parseDate(b.date) -
                   parseDate(a.date);

        });


        /* 最新動画 */

        displayLatestVideo(videos);


        /* 動画一覧 */

        displayVideos(videos);


        /* 検索機能 */

        setupSearch(videos);


    } catch (error) {

        console.error(error);


        if (container) {

            container.innerHTML = `

                <div class="no-results">

                    <strong>
                        動画データを取得できませんでした
                    </strong>

                    <p>
                        しばらく時間をおいてから
                        再度お試しください。
                    </p>

                </div>

            `;

        }

    }

}


/* ======================================================
   CSV解析
====================================================== */

function parseCSV(csv) {

    const rows = [];

    let row = [];

    let value = "";

    let insideQuotes = false;


    for (let i = 0; i < csv.length; i++) {

        const char = csv[i];

        const next = csv[i + 1];


        /* ダブルクォーテーション */

        if (char === '"') {

            if (
                insideQuotes &&
                next === '"'
            ) {

                value += '"';

                i++;

            } else {

                insideQuotes =
                    !insideQuotes;

            }

            continue;

        }


        /* カンマ */

        if (
            char === "," &&
            !insideQuotes
        ) {

            row.push(value.trim());

            value = "";

            continue;

        }


        /* 改行 */

        if (
            (char === "\n" || char === "\r") &&
            !insideQuotes
        ) {

            if (
                char === "\r" &&
                next === "\n"
            ) {

                i++;

            }


            row.push(value.trim());

            value = "";


            if (row.some(cell => cell !== "")) {

                rows.push(row);

            }


            row = [];

            continue;

        }


        value += char;

    }


    /* 最後の行 */

    if (value !== "" || row.length > 0) {

        row.push(value.trim());

        if (row.some(cell => cell !== "")) {

            rows.push(row);

        }

    }


    if (rows.length < 2) {

        return [];

    }


    /* 1行目を見出しとして使用 */

    const headers =
        rows[0].map(header =>
            header.trim()
        );


    const dateIndex =
        headers.indexOf("日付");

    const categoryIndex =
        headers.indexOf("大会");

    const opponentIndex =
        headers.indexOf("対戦相手");

    const venueIndex =
        headers.indexOf("会場");

    const youtubeIndex =
        headers.indexOf("動画URL");


    return rows
        .slice(1)
        .map(row => {

            return {

                date:
                    row[dateIndex] || "",

                category:
                    row[categoryIndex] || "",

                opponent:
                    row[opponentIndex] || "",

                venue:
                    row[venueIndex] || "",

                youtube:
                    row[youtubeIndex] || ""

            };

        })
        .filter(video =>
            video.youtube !== ""
        );

}


/* ======================================================
   日付をDateに変換
====================================================== */

function parseDate(dateString) {

    if (!dateString) {

        return 0;

    }


    const normalized =
        dateString
            .replace(/\//g, "-")
            .replace(/\./g, "-");


    const date =
        new Date(normalized);


    if (isNaN(date.getTime())) {

        return 0;

    }


    return date.getTime();

}


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

        const match =
            url.match(pattern);


        if (match) {

            return match[1];

        }

    }


    return "";

}


/* ======================================================
   YouTubeサムネイル
====================================================== */

function getThumbnail(videoId) {

    if (!videoId) {

        return "";

    }


    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

}


/* ======================================================
   動画カード
====================================================== */

function createVideoCard(video) {

    const videoId =
        getYoutubeId(video.youtube);

    const thumbnail =
        getThumbnail(videoId);


    return `

        <article
            class="video-card"
            onclick="openVideo('${videoId}')"
        >

            <div class="thumbnail">

                <img
                    src="${thumbnail}"
                    alt="${escapeHTML(video.category)} vs ${escapeHTML(video.opponent)}"
                    loading="lazy"
                >

                <div class="play-button">
                    ▶
                </div>

                <div class="video-category">
                    ${escapeHTML(video.category)}
                </div>

            </div>


            <div class="video-info">

                <h3>
                    ${escapeHTML(video.category)}
                </h3>

                <p class="video-opponent">
                    ⚽ vs ${escapeHTML(video.opponent)}
                </p>

                <div class="video-meta">

                    <span>
                        📅 ${escapeHTML(video.date)}
                    </span>

                    <span>
                        📍 ${escapeHTML(video.venue)}
                    </span>

                </div>


                <button
                    class="watch-btn"
                    onclick="event.stopPropagation(); openVideo('${videoId}')"
                >
                    ▶ 動画を見る
                </button>

            </div>

        </article>

    `;

}


/* ======================================================
   最新動画
====================================================== */

function displayLatestVideo(videos) {

    const container =
        document.getElementById("latestVideo");


    if (!container) {

        return;

    }


    if (videos.length === 0) {

        container.innerHTML = `

            <div class="no-results">

                <strong>
                    動画がありません
                </strong>

            </div>

        `;

        return;

    }


    container.innerHTML =
        createVideoCard(videos[0]);

}


/* ======================================================
   動画一覧
====================================================== */

function displayVideos(videos) {

    const container =
        document.getElementById("videoList");


    if (!container) {

        return;

    }


    if (videos.length === 0) {

        container.innerHTML = `

            <div class="no-results">

                <strong>
                    動画が見つかりません
                </strong>

                <p>
                    検索条件を変更してください。
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        videos
            .map(video =>
                createVideoCard(video)
            )
            .join("");

}

/* ======================================================
   検索・フィルター
====================================================== */

function setupSearch(allVideos) {

    const searchBox =
        document.getElementById("search");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const monthFilter =
        document.getElementById("monthFilter");

    const clearButton =
        document.getElementById("clearFilters");


    /* 大会フィルター作成 */

    setupCategoryFilter(
        allVideos,
        categoryFilter
    );


    /* 年月フィルター作成 */

    setupMonthFilter(
        allVideos,
        monthFilter
    );


    /* 検索 */

    if (searchBox) {

        searchBox.oninput =
            function() {

                applyFilters(allVideos);

            };

    }


    /* 大会 */

    if (categoryFilter) {

        categoryFilter.onchange =
            function() {

                applyFilters(allVideos);

            };

    }


    /* 年月 */

    if (monthFilter) {

        monthFilter.onchange =
            function() {

                applyFilters(allVideos);

            };

    }


    /* クリア */

    if (clearButton) {

        clearButton.onclick =
            function() {

                if (searchBox) {

                    searchBox.value = "";

                }


                if (categoryFilter) {

                    categoryFilter.value = "";

                }


                if (monthFilter) {

                    monthFilter.value = "";

                }


                applyFilters(allVideos);

            };

    }

}


/* ======================================================
   大会フィルター
====================================================== */

function setupCategoryFilter(
    videos,
    select
) {

    if (!select) {

        return;

    }


    const categories =
        [
            ...new Set(
                videos
                    .map(video =>
                        video.category.trim()
                    )
                    .filter(Boolean)
            )
        ];


    categories.sort(
        (a, b) =>
            a.localeCompare(b, "ja")
    );


    categories.forEach(
        function(category) {

            const option =
                document.createElement("option");


            option.value =
                category;


            option.textContent =
                category;


            select.appendChild(option);

        }
    );

}


/* ======================================================
   年月フィルター
====================================================== */

function setupMonthFilter(
    videos,
    select
) {

    if (!select) {

        return;

    }


    const months =
        [
            ...new Set(

                videos

                    .map(video =>
                        getYearMonth(video.date)
                    )

                    .filter(Boolean)

            )
        ];


    months.sort(
        (a, b) =>
            b.localeCompare(a)
    );


    months.forEach(
        function(month) {

            const option =
                document.createElement("option");


            option.value =
                month;


            option.textContent =
                formatYearMonth(month);


            select.appendChild(option);

        }
    );

}


/* ======================================================
   年月を取得
====================================================== */

function getYearMonth(dateString) {

    if (!dateString) {

        return "";

    }


    const match =
        String(dateString).match(
            /(\d{4})[\/\-.](\d{1,2})/
        );


    if (!match) {

        return "";

    }


    const year =
        match[1];


    const month =
        String(match[2]).padStart(
            2,
            "0"
        );


    return `${year}-${month}`;

}


/* ======================================================
   年月表示
====================================================== */

function formatYearMonth(month) {

    const parts =
        month.split("-");


    if (parts.length !== 2) {

        return month;

    }


    return `${parts[0]}年${Number(parts[1])}月`;

}


/* ======================================================
   全フィルター適用
====================================================== */

function applyFilters(allVideos) {

    const searchBox =
        document.getElementById("search");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const monthFilter =
        document.getElementById("monthFilter");


    const keyword =
        searchBox
            ? searchBox.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "";


    const month =
        monthFilter
            ? monthFilter.value
            : "";


    const results =
        allVideos.filter(
            function(video) {


                /* キーワード */

                const text = `

                    ${video.date}
                    ${video.category}
                    ${video.opponent}
                    ${video.venue}

                `.toLowerCase();


                const matchesKeyword =
                    !keyword ||
                    text.includes(keyword);


                /* 大会 */

                const matchesCategory =
                    !category ||
                    video.category === category;


                /* 年月 */

                const matchesMonth =
                    !month ||
                    getYearMonth(
                        video.date
                    ) === month;


                return (
                    matchesKeyword &&
                    matchesCategory &&
                    matchesMonth
                );

            }
        );


    displayVideos(results);


    updateFilterResult(
        results.length,
        allVideos.length
    );

}


/* ======================================================
   検索結果件数
====================================================== */

function updateFilterResult(
    resultCount,
    totalCount
) {

    const oldMessage =
        document.querySelector(
            ".filter-result"
        );


    if (oldMessage) {

        oldMessage.remove();

    }


    const videoList =
        document.getElementById(
            "videoList"
        );


    if (!videoList) {

        return;

    }


    const message =
        document.createElement("div");


    message.className =
        "filter-result";


    message.textContent =
        `${resultCount}件 / 全${totalCount}件`;


    videoList.parentNode.insertBefore(
        message,
        videoList
    );

}

    /* 二重登録防止 */

    searchBox.oninput = function() {

        const keyword =
            this.value
                .trim()
                .toLowerCase();


        if (!keyword) {

            displayVideos(allVideos);

            return;

        }


        const results =
            allVideos.filter(video => {

                const text = `

                    ${video.date}
                    ${video.category}
                    ${video.opponent}
                    ${video.venue}

                `.toLowerCase();


                return text.includes(keyword);

            });


        displayVideos(results);

    };

}


/* ======================================================
   HTMLエスケープ
====================================================== */

function escapeHTML(value) {

    if (!value) {

        return "";

    }


    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* ======================================================
   開始
====================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadVideos();

    }
);
/* ======================================================
   サイト内YouTube再生
====================================================== */

function openVideo(videoId) {

    if (!videoId) {

        return;

    }


    const modal =
        document.getElementById("videoModal");


    const iframe =
        document.getElementById("youtubePlayer");


    if (!modal || !iframe) {

        return;

    }


    iframe.src =
        "https://www.youtube.com/embed/" +
        videoId +
        "?autoplay=1&rel=0";


    modal.classList.add("active");


    document.body.style.overflow =
        "hidden";

}


/* ======================================================
   動画再生画面を閉じる
====================================================== */

function closeVideo() {

    const modal =
        document.getElementById("videoModal");


    const iframe =
        document.getElementById("youtubePlayer");


    if (!modal || !iframe) {

        return;

    }


    iframe.src = "";

    modal.classList.remove("active");


    document.body.style.overflow =
        "";

}


/* ======================================================
   ESCキーで閉じる
====================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeVideo();

        }

    }
);
