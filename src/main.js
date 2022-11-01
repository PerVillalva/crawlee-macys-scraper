import { CheerioCrawler } from "crawlee";
import { router } from "./routes.js";
import { LABELS } from "./consts.js";

const crawler = new CheerioCrawler({
    requestHandler: router,
});

await crawler.addRequests([
    {
        url: "https://www.macys.com/shop/search/Pageindex/1?keyword=mens%20shoes",
        label: LABELS.START,
    },
]);

await crawler.run();
