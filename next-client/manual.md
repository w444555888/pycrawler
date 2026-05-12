版本 Next.js 16

Next.js 是什麼？
Next.js 是一個全端（full-stack）框架，將在建立 React 應用時通常需要單獨安裝和設定的各種套件、工具整合並內建提供。

在傳統的 React 應用開發中，你可能需要額外加入這些東西：

路由 → react-router
SEO 對策 → react-helmet
打包工具 → Webpack、Vite 的設定
伺服器端渲染 → Next.js 等框架
API 伺服器 → 另行建立 Express.js 等
圖片最佳化 → 另外的套件或工具
使用 Next.js，以上許多功能要麼一開始就內建、要麼由官方優化提供，讓你不用為各式設定煩惱，就能快速開始開發！

此外，前端與後端（API Routes）可以在同一個專案中撰寫，因此被稱為「全端（Full-stack）」框架。


CSR：適合需要根據使用者操作即時變化的 UI（儀表板、聊天室、管理介面），或 SEO 不重要的頁面（登入後的頁面）。
SSR：適合需要顯示最新資訊且 SEO 重要的頁面（新聞網站、SNS 時間軸、庫存資訊等）。
SSG：適合更新頻率低的靜態內容（公司簡介、使用條款、文件站），速度最快且伺服器負載低。
ISR：適合定期更新但不需即時性的內容（商品頁、天氣預報等），在速度與資料新鮮度間取得平衡。
PPR：當一個頁面內既有靜態內容又有動態內容時，例如文章正文靜態、留言動態，或商品資訊靜態、庫存數量動態。



1. App Router 最重要的特性是：app 目錄內的資料夾結構會直接對應到 URL 路徑。此外預設使用 Server Component（伺服器元件），因此能更容易構建在效能與 SEO 上表現良好的應用。也方便管理多頁面共用的 Layout。

    在 App Router 中，app 目錄的資料夾結構非常重要。資料夾名稱會對應 URL 路徑，特定檔名則決定該路由的角色：
    
        page.tsx：定義該路由的主要內容，是必須的。若沒有此檔案，該路由無法存取

        layout.tsx：定義與子路由共用的版面配置

        [id] 這類以中括號包住的資料夾名稱則代表動態參數。



2. 這是 Server Component 的一大特性：可以在元件內直接執行非同步處理。

    什麼是 Server Component？
    Server Component（伺服器元件）是在伺服器端執行，並以已經完成的 HTML 傳回瀏覽器的 React 元件。

    在 RSC（React Server Components）出現前（例如 Create React App），所有元件都在瀏覽器執行。伺服器回傳幾乎空的 HTML，下載並執行 JS 後才組裝頁面，這就是 CSR（客戶端渲染）。而 Server Component 只在伺服器執行，因此不能使用 useState 或 useEffect 等瀏覽器專用 API，但能在伺服器端完成資料取得再生成 HTML，提升首屏速度並減小 JS 包體積。

    另外，若元件加上 "use client" 變為 Client Component，常會與 SSR/SSG 搭配使用，因此「Client Component = CSR」並不正確。CSR、SSR、SSG 是渲染策略（哪裡產生 HTML），而 Server/Client Component 表示元件執行位置，兩者是不同的概念。



3. SSG 是在建置時（build time）一次生成 HTML，之後就直接提供靜態檔案的方式。建置時會從 API 取得資料生成 HTML；不論多少次存取，伺服器都只回傳事先生成的 HTML，不需再次呼叫 API。

優點是速度極快，因為直接提供已完成的 HTML，伺服器處理時間幾乎為零，與 CDN 搭配能全球快速提供內容。缺點是內容更新須重新建置並部署，故不適合頻繁更新的內容。

在 App Router 中，可以在 fetch 中指定 cache: 'force-cache' 來實現 SSG：



4. PPR（Partial Pre-rendering）是從 Next.js 14 起引入的新功能，允許在同一頁面中結合靜態與動態部分。將頁面內容拆成靜態與動態兩部分：靜態部分在初次存取即顯示，而動態部分則可採用串流（streaming）逐步顯示，讓頁面在載入時就先呈現可見內容。

在 Next.js 中使用 PPR 常與 Suspense 搭配