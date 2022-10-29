import { Dataset, createCheerioRouter } from "crawlee";

export const router = createCheerioRouter();

// Pagination
router.addHandler("start", async ({ $, crawler, log, request }) => {
  log.info(`enqueueing new URLs on page ${request.url}`);

  const lastPage = +$('select[name="dropdown"] > option:last-child').prop(
    "value"
  );
  log.info(`Found ${lastPage} pages. Enqueuing all requests now.`);

  for (const page of [...Array(lastPage + 1).keys()].slice(2)) {
    await crawler.requestQueue.addRequest({
      url: request.url.replace(/Pageindex\/\d+/, `Pageindex/${page}`),
      label: "productPage",
    });
  }
});

// Enqueue links from all the products displayed on each page
router.addHandler("productPage", async ({ log, request, enqueueLinks }) => {
  log.info(`Enqueueing products on page ${request.url}`);

  await enqueueLinks({
    selector: "div.cell .productThumbnailImage .productDescLink",
    label: "productDetail",
  });
});

// Extract product details
router.addHandler("productDetail", async ({ request, $, log }) => {
  log.info(`Extracting product data on page ${request.url}`);

  // Product characteristics (brand, name, colors, sizes)
  const productCharacteristics = {
    productBrand: $('a[data-auto="product-brand"]')
      .text()
      .trim()
      .split("\n")[0],
    productName: $("h1.p-brand-title div.h3").text().trim().split("\n")[0],
    colorOptions: [],
    availableSizes: [],
    productRating: "",
  };

  // Product colors
  const colors = $('ul[role="presentation"] li div');
  for (const color of colors) {
    productCharacteristics.colorOptions.push($(color).prop("aria-label"));
  }

  // Product sizes
  const sizes = $(".swatch-itm.cell.selection-tile.static");
  for (const size of sizes) {
    productCharacteristics.availableSizes.push($(size).text().trim());
  }

  // Product prices (original and discounted)
  const prices = $("div.tiered-prices div").text().trim().split("\n");
  const productPrice = {
    discountedPrice: prices[0],
    originalPrice: prices[prices.length - 1].trim(),
  };
  // Check if product is on sale
  if (productPrice.originalPrice === productPrice.discountedPrice) {
    productPrice.discountedPrice = "Product is not on sale.";
  }

  //Product reviews
  const reviews = $('a[data-auto="review-count"] span')
    .text()
    .trim()
    .split("\n")[0]
    .split(" ");
  // Check if product has received any reviews
  if (!(reviews.length === 2)) {
    productCharacteristics.productRating =
      "This app hasn't received any reviews yet";
  } else {
    const starsCount = reviews[0];
    const reviewsCount = reviews[1].slice(1, -1);
    productCharacteristics.productRating = `This product received ${reviewsCount} reviews, averaging ${starsCount}/5 stars`;
  }

  // Organize all the scraped data in a single object
  const results = {
    url: request.loadedUrl,
    ...productCharacteristics,
    ...productPrice,
  };

  // Push the obtained data to the dataset
  await Dataset.pushData({
    results,
  });
});
