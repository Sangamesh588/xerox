import { PrintConfiguration, PriceBreakdown, XeroxShop } from '@/types';

export function calculatePrice(
  totalPages: number,
  config: PrintConfiguration,
  shop: XeroxShop
): PriceBreakdown {
  // 1. Determine effective pages based on range
  let effectivePages = totalPages;

  if (config.pageRangeType === 'custom') {
    const start = Math.max(1, Math.min(totalPages, config.startPage || 1));
    const end = Math.max(start, Math.min(totalPages, config.endPage || totalPages));
    effectivePages = (end - start) + 1;
  }

  // 2. Calculate physical sheets needed based on N-up layout
  let pagesPerSheetSide = 1;
  if (config.nUp === '2in1') pagesPerSheetSide = 2;
  if (config.nUp === '4in1') pagesPerSheetSide = 4;

  const pagesPerPhysicalSheet = config.sideMode === 'double'
    ? pagesPerSheetSide * 2
    : pagesPerSheetSide;

  const sheetsNeeded = Math.ceil(effectivePages / pagesPerPhysicalSheet) * config.copies;

  // 3. Determine base rate per sheet/side
  let printCostPerSheet = 0;
  const rates = shop.rates;

  if (config.colorMode === 'bw') {
    if (config.sideMode === 'double') {
      printCostPerSheet = rates.bwDouble;
    } else {
      printCostPerSheet = rates.bwSingle;
    }
  } else {
    if (config.sideMode === 'double') {
      printCostPerSheet = rates.colorDouble;
    } else {
      printCostPerSheet = rates.colorSingle;
    }
  }

  // Adjust for Paper Size multiplier
  let sizeMultiplier = 1.0;
  let paperSizeCost = 0;
  if (config.paperSize === 'A3') {
    sizeMultiplier = 2.0;
    paperSizeCost = sheetsNeeded * 1.5;
  } else if (config.paperSize === 'Legal') {
    paperSizeCost = sheetsNeeded * 0.5;
  }

  // Adjust for GSM paper quality cost
  let gsmCost = 0;
  if (config.paperGsm === '80') {
    gsmCost = sheetsNeeded * 0.50; // ₹0.50 extra per sheet
  } else if (config.paperGsm === '100') {
    gsmCost = sheetsNeeded * 1.50; // ₹1.50 extra per sheet
  }

  const printCost = (sheetsNeeded * printCostPerSheet * sizeMultiplier);

  // 4. Binding cost
  let bindingCost = 0;
  if (config.binding === 'spiral') {
    bindingCost = rates.spiralBinding * config.copies;
  } else if (config.binding === 'hardcover') {
    bindingCost = rates.hardBinding * config.copies;
  } else if (config.binding === 'corner_clip') {
    bindingCost = rates.cornerClip * config.copies;
  }

  // Total calculation rounded to nearest rupee
  const subtotal = printCost + bindingCost + gsmCost + paperSizeCost;
  const totalCost = Math.max(5, Math.round(subtotal));

  return {
    effectivePages,
    sheetsNeeded,
    printCost: Math.round(printCost * 100) / 100,
    bindingCost: Math.round(bindingCost * 100) / 100,
    gsmCost: Math.round(gsmCost * 100) / 100,
    paperSizeCost: Math.round(paperSizeCost * 100) / 100,
    deliveryFee: 0,
    totalCost,
  };
}
