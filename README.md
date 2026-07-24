# 福建台风追踪 (Fujian Typhoon Tracker)

🌐 在线访问：https://kzhengting.github.io/typhoon-fujian-tracker/

面向福建省的台风实时监测页面：以省内 9 个地级市为中心，实时计算台风中心距离、强度与风雨影响，并支持台风切换与自动识别当前活动台风。覆盖 1949 年至今全部历史台风档案，支持跨年份按名称、拼音首字母、影响福建、登陆福建检索。

## 功能特性

- **多城市监测**：内置福建 9 市（福州、厦门、泉州、漳州、莆田、宁德、龙岩、南平、三明），点击顶部分段选择器即可切换监测中心，距离 / 时间线 / 逐小时表随城市实时重算。
- **台风身份信息**：解析并展示**年份 + 第 N 号台风 + 中英文名 + 名字含义**（如「2026 年第 9 号台风 巴威 BAVI · 名字含义：位于越南北部的山脉」），下拉选择器与编号栏均带年份编号。
- **台风可切换 / 自动识别**：自动拉取中央气象台台风列表，默认定位当前活动台风（`status=start`），并可通过下拉框手动切换任意历史台风。
- **历史台风档案（1949 至今）**：顶部**年份选择器**（1949～今年），可浏览中央气象台全部历史台风；选中后展示完整最佳路径、生命周期与「曾影响福建」标识。例如 **2006 年第 8 号台风「桑美」**——巅峰 915hPa / 60m/s 的超强台风，全程最靠近福建宁德约 74km，是典型重创闽浙的台风。历史台风**无风圈与预报数据**，风圈开关会自动禁用；「城市影响」区也会自动从"实时天气预报"切换为**「福建各地市历史影响」**——展示 9 个地市各自的最近距离、经过时刻与当时台风强度（基于最佳路径推算，非实况观测），逐小时实时预报表则自动隐藏，避免用历史台风套用今天的天气。
- **跨年份台风检索**：搜索框支持跨 1949 至今全量索引检索，可输入台风中文名、英文名、年份或编号。特别支持**拼音首字母搜索**——例如输入「MSK」即可命中「美莎克」（索引中预存 `pinyin` 字段）。搜索框旁「影响福建」（全程最近距福建 < 300km）与「登陆福建」（海岸线穿越检测：路径海→陆穿越且登陆点落在福建海岸段，非官方登陆记录）两个互斥选项卡，可在全部历史台风中筛选。命中数超过 600 条时仅列出前 600 条。
- **实时态势**：基于所选城市与台风路径计算中心距离、强度、中心气压、最大风速、移向移速，地图绘制实况路径与中国预报路径。
- **降雨影响强化**：按国标 24 小时累计雨量口径给出**暴雨分级**（小雨 / 中雨 / 大雨 / 暴雨 / 大暴雨 / 特大暴雨），影响卡片突出显示降水量、概率与量级徽标；概览给出预报窗口**累计雨量**与**最强降雨日**；逐小时表新增**降雨列**（每小时雨量 + 概率 + 强度标签）。
- **影响时间线 + 逐小时体感**：按所选城市插值估算逐小时距离、风力体感与降雨，给出未来几天风雨影响评估与「今天 / 高峰」徽标。
- **历史风圈 + 逐点观测**：地图叠加 **7/10/12 级风圈**（NMC 四象限半径，真实非对称形状），可用「风圈」按钮开关；沿历史路径绘制**可点击观测点**（「点位」按钮开关），弹窗显示该时次的等级、气压、风速、移向移速与风圈半径。点击任一观测点或路径线会单独展示该时次风圈。
- **全生命周期时间线**：从各观测点强度/气压/位置推导 **生成 → 加强为台风 → 巅峰强度 → 强度减弱 → 最接近福建 → 登陆中国大陆 → 最新/停编** 全过程，并给出**生命时长、巅峰强度、累计移动距离、观测点数、对福建影响、登陆情况**等关键指标。其中「登陆中国大陆」由路径点与中国大陆海岸线多边形交叉检测算法推导（坐标纠偏后），非官方登陆记录。
- **卫星云图叠加**：可一键叠加 NASA GIBS 真彩卫星云图（与 zoom.earth 同源数据，每日更新），直观查看台风云系结构。
- **外部视角联动**：一键跳转 **Zoom.earth**（卫星动画）与 **Windy**（实时风场），自动定位到当前台风中心经纬度。
- **自动刷新**：每 5 分钟自动刷新列表与路径数据，检测新活动台风（刷新不会重置已选城市 / 台风）；浏览器标签页重新可见时（`visibilitychange`）也会立即触发一次刷新。
- **底图 2D 切换**：地图右上角提供「底图类型（高德 / Open地图）× 亮色 / 暗色」二维切换，共 4 种组合（高德亮色、高德暗色、Open 亮色、Open 暗色），详见下方[底图与坐标系](#底图与坐标系)。
- **叠加图层**：除卫星云图外，还支持叠加**高德卫星影像**（卫星瓦片 + 中文路网标注双层）。
- **测距工具**：点击「测距」按钮进入测距模式，随后点击地图任意位置依次落点，相邻两点间以虚线连接并标注球面距离（km / m）。
- **全屏切换**：点击「全屏」按钮进入浏览器全屏模式，再次点击退出。
- **移动端面板收起 / 展开**：移动端左上角「收起 / 展开」按钮可隐藏全部信息浮层，露出完整地图；点击空白地图区域亦可切换。面板收起后自动恢复地图拖拽与双指缩放。
- **PC 端 Ctrl + 滚轮缩放**：桌面端默认滚轮滚动页面（避免误触地图缩放），按住 Ctrl（或 Cmd）滚动时才缩放地图，自定义缩放按钮始终可用。
- **自动框选视角**：加载或切换台风时地图自动缩放并居中到「福建 + 当前路径」，开局视角最优；「框选路径」按钮可随时恢复该视角。

## 数据来源

- **台风路径 / 强度 / 预报**：中央气象台（国家气象中心，NMC）公开接口
  - 列表（当年）：`https://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_default`
  - 列表（历史年份）：`https://typhoon.nmc.cn/weatherservice/typhoon/jsons/list_{年份}`（如 `list_2006`，支持 1949 年至今）
  - 详情：`https://typhoon.nmc.cn/weatherservice/typhoon/jsons/view_{台风编号}`
  - 接口返回 `Access-Control-Allow-Origin: *`，纯静态站点可直接在浏览器 `fetch`，**无需任何后端代理**。
  - **注意：返回体为 JSONP 包裹**（形如 `typhoonCallBack({...})`），代码通过 `stripJsonp` 截取首个 `{` 到末个 `}` 之间的 JSON 文本再 `JSON.parse`。
- **城市风雨（阵风 / 降水 / 气温）**：[Open-Meteo](https://open-meteo.com/)（CORS 友好），按所选城市经纬度动态请求。
  - 端点：`https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}`
  - `daily` 字段：`weather_code, temperature_2m_max, temperature_2m_min, precipitation_sum, precipitation_probability_max, wind_speed_10m_max, wind_gusts_10m_max`
  - `hourly` 字段：`temperature_2m, precipitation, precipitation_probability, wind_speed_10m, wind_gusts_10m, weather_code`
  - `forecast_days=5`，`timezone=Asia/Shanghai`
- **卫星云图**：[NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) MODIS Terra 真彩（CorrectedReflectance_TrueColor），每日更新（取昨日日期），作为可选叠加瓦片图层。
  - 瓦片模板：`https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{YYYY-MM-DD}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`
- **高德瓦片**：底图与卫星叠加均使用高德地图公开瓦片服务（详见下方[底图与坐标系](#底图与坐标系)）。
- **本地跨年份索引 `typhoon-index.json`**：仓库根目录预置一份覆盖 1949 至今（约 2535 个台风）的轻量索引，供前端做秒级跨年份检索。字段：
  - `id` / `year` / `no` / `name` / `enName` / `pinyin`（中文名拼音首字母，如「美莎克」→`MSK`）/ `fjMin`（全程路径到福建九市最小距离，km）/ `fujianHit`（`fjMin<300`）/ `landFujian`（海岸线穿越检测：路径海→陆穿越且登陆点落在福建海岸段）
  - 前端以 `fetch("typhoon-index.json", {cache:"force-cache"})` 加载；若加载失败则禁用搜索框（占位符改为「索引未就绪，仅支持按年份选择」）并禁用「影响福建 / 登陆福建」选项卡。
  - 阈值口径：**影响福建 < 300km**（按路径点到福建九市最近距离推导）；**登陆福建** 用海岸线穿越检测（路径海→陆穿越且登陆点落在福建海岸段），非距离阈值。两者均为路径几何推导，**非官方登陆记录**。
- **外链**：按台风中心经纬度深链接至 [Zoom.earth](https://zoom.earth/)（`https://zoom.earth/#view={lat},{lng},6z`）与 [Windy](https://www.windy.com/)（`https://www.windy.com/?{lat},{lng},6`）。

## 技术栈

- 单文件 `index.html`（内嵌 CSS + 原生 JS，无运行时构建步骤）。
- 唯一外部库：[Leaflet 1.9.4](https://leafletjs.com/)（CSS + JS 均从 `https://unpkg.com/leaflet@1.9.4/dist/` 加载）。
- 依赖预构建的 `typhoon-index.json`（仓库已提交，无需运行时生成）。
- 索引构建脚本 `scripts/build-typhoon-index.js`：一次性 Node 爬虫，遍历 NMC 1949→当前年份各年台风列表与路径详情，对每个台风计算 haversine 最小距离到福建 9 市，输出 `typhoon-index.json`；用 [`pinyin-pro`](https://www.npmjs.com/package/pinyin-pro) 生成中文名拼音首字母。
  - 支持断点续跑：详情距离缓存于 `scripts/.cache-fjmin.json`，中断后重跑自动跳过已抓取项。
  - 运行：
    ```bash
    cd scripts && npm install && node build-typhoon-index.js
    ```
- 纯静态，可托管于 GitHub Pages / 任意静态空间。

## 底图与坐标系

### 底图（2D 切换）

地图右上角提供「底图类型 × 亮 / 暗」二维切换，共 4 种组合，默认高德亮色：

| 组合 | 瓦片模板 | 说明 |
| --- | --- | --- |
| 高德亮色 | `https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}`（`subdomains=1234`） | 高德中文标注路网底图 |
| 高德暗色 | 同上，置于独立 `pane="gaodeDark"`，CSS 滤镜 `invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.95)` | 复用高德瓦片压暗，不影响叠加层 |
| Open 亮色 | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`（`subdomains=abcd`） | CartoDB / OpenStreetMap 亮色 |
| Open 暗色 | `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`（`subdomains=abcd`） | CartoDB 暗色 |

切换亮色底图时页面会隐藏暗角蒙版（`body[data-basemap="light"]`），避免浅色底图上出现黑斑。

### 叠加图层（3 个）

| 图层 | 瓦片模板 | 说明 |
| --- | --- | --- |
| NASA GIBS 卫星云图 | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{YYYY-MM-DD}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg` | 取昨日日期，`maxZoom:9`，默认关闭 |
| 高德卫星影像 | `https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}`（`subdomains=1234`） | 纯卫星影像 |
| 高德卫星标注 | `https://wprd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=1&style=8&ltype=2&x={x}&y={y}&z={z}`（`subdomains=1234`） | 中文路网标注，与卫星影像叠放为同一开关 |

### 坐标系（重要）

不同数据源的坐标系不同，应用按当前底图类型分别处理：

- **福建九市坐标（`CITIES`）为 WGS-84 源**。
- **NMC 台风路径坐标为 WGS-84/CGCS2000 源**（详见下方实测结论）。
- 当前底图为**高德（GCJ-02 底图）**时：
  - 城市标记经 `safeCityLL` 做 WGS-84 → GCJ-02 转换后落点；
  - 台风路径点经 `safePathLL` 同样做 WGS-84 → GCJ-02 转换后落点（与 `safeCityLL` 等价，因二者同源 WGS-84）。
- 当前底图为 **CartoDB（WGS-84 底图）**时：
  - 城市标记直接使用 WGS-84；
  - 台风路径点经 `safePathLL` 直接使用 WGS-84（无需转换）。
- **登陆中国大陆检测**（`detectLandfall`）：遍历相邻路径点对，将 NMC 路径点（WGS-84）直接与 WGS-84 中国大陆海岸线多边形做射线投射，判断「海 → 陆」状态切换，得到登陆时刻与位置。

> 坐标系实测结论：**NMC 台风路径坐标为 WGS-84/CGCS2000**（非 GCJ-02）。验证方法——puppeteer 打开 NMC 官网 `typhoon.nmc.cn`，36 张地图瓦片全部来自 `https://image.nmc.cn/tiles/tianditu/img_w/{z}/{x}/{y}.png`（天地图卫星影像）。天地图官方采用 CGCS2000（中国 2000 国家大地坐标系，与 WGS-84 差异仅 0.3~0.6 米，绝非 GCJ-02 火星加密）；进一步检查 NMC 的 `typhoon-web.js`（76KB）与 `typhoon-datas-inner.js`，对 `gcj/wgs/transform/offset/encrypt` 等关键词零匹配——NMC 数据链路全程不做坐标转换，原始坐标直接落点于天地图（WGS-84）底图。CGCS2000 是中国法定数据坐标系，NMC 作为国家级气象机构其台风坐标即 CGCS2000/WGS-84。此前 B6 用杜苏芮在高德底图视觉对齐的验证无法定论（NMC 坐标精度 0.1°≈11km，而 GCJ-02 偏移仅 ~500m，视觉不可区分），现已由瓦片来源 + 脚本审查确证。

**距离计算口径**：NMC 路径点与 `CITIES`/`CHINA_COASTLINE` 均为 WGS-84，故构建期（`build-typhoon-index.js`）与前端运行时（`renderData`/`renderLifecycle` 的 `haversineKm`）均直接使用 NMC 原始坐标算距离，前后端口径一致，无需任何 GCJ-02↔WGS-84 转换。

## 本地运行

```bash
# 方式一：直接用浏览器打开 index.html（需联网访问上述接口）
# 方式二：起一个本地静态服务器（推荐，避免个别浏览器对 file:// 的限制）
node serve.js          # 然后访问 http://localhost:8080/
# 或： python -m http.server 8080
```

如需重建跨年份索引（一般不需要，仓库已附带 `typhoon-index.json`）：

```bash
cd scripts && npm install && node build-typhoon-index.js
```

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库（如 `typhoon-fujian-tracker`）。
2. 将本目录 `index.html`、`typhoon-index.json` 推送到仓库 `main` 分支根目录。
3. 仓库 **Settings → Pages → Source** 选择 `Deploy from a branch` / `main` / `/ (root)`。
4. 稍候片刻，访问 `https://<你的用户名>.github.io/typhoon-fujian-tracker/`。
5. （可选）绑定自定义域名：在 Pages 设置中填入域名并添加 `CNAME` 文件。

## 免责声明

本页地图底图支持高德地图（中文标注，亮 / 暗可切换）与 CartoDB / OpenStreetMap（亮 / 暗可切换），台风路径与强度数据来自中央气象台与 Open-Meteo 数值预报，**仅供参考**。台风路径与强度以中央气象台 / 福建省气象台正式预警为准，请勿用于防灾决策依据。「影响福建 / 登陆福建」与「登陆中国大陆」均为路径几何推导，非官方登陆记录。
