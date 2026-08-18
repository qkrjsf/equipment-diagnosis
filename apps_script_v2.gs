// ===== 설정: 시트 이름 (실제 탭 이름과 정확히 일치해야 함) =====
const SHEET_DIAG = '진단이력';
const SHEET_USAGE = '사용이력';
const SHEET_REPAIR = '수리이력';
const SHEET_STOCK = '재고현황';
const SHEET_ITEM = '품목';

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  if (data.type === 'usage') {
    // 부품 사용 등록
    const sheet = ss.getSheetByName(SHEET_USAGE);
    sheet.appendRow([
      new Date(),
      data.category || '',
      data.spec || '',
      data.location || '',
      data.qty || 0,
      data.memo || ''
    ]);
  } else if (data.type === 'repair_out') {
    // 수리 출고 등록 (입고일시는 비워둠 = 수리중), 출고일은 시간 없이 날짜만 기록
    const sheet = ss.getSheetByName(SHEET_REPAIR);
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Seoul', 'yyyy-MM-dd');
    sheet.appendRow([
      today,
      data.category || '',
      data.spec || '',
      data.vendor || '',
      data.qty || 0,
      '',
      data.memo || ''
    ]);
  } else {
    // 기존 진단이력 기록 (기본값)
    const sheet = ss.getSheetByName(SHEET_DIAG);
    sheet.appendRow([
      new Date(),
      data.lang || '',
      data.category || '',
      data.cause || '',
      data.solution || ''
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const type = (e.parameter && e.parameter.type) || 'stock';

  if (type === 'stock') {
    const sheet = ss.getSheetByName(SHEET_STOCK);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    const rows = values.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    });

    // 품목 탭에서 제품규격 기준으로 나머지 상세정보를 모아서 합치기
    const itemSheet = ss.getSheetByName(SHEET_ITEM);
    const itemValues = itemSheet.getDataRange().getValues();
    const itemHeaders = itemValues[0];
    const specCol = itemHeaders.indexOf('제품규격');
    const itemMap = {};
    if (specCol !== -1) {
      itemValues.slice(1).forEach(r => {
        const obj = {};
        itemHeaders.forEach((h, i) => obj[h] = r[i]);
        itemMap[r[specCol]] = obj;
      });
    }
    rows.forEach(row => {
      const item = itemMap[row['제품규격']] || {};
      row['제품형태'] = item['제품형태'] || '';
      row['거래처'] = item['거래처'] || '';
      row['비고'] = item['비고'] || '';
      row['수리가능여부'] = item['수리가능여부'] || '';
      row['사진링크'] = item['사진링크'] || '';
    });

    // 수리이력에서 아직 입고 안 된(입고일시 비어있는) 건들을 규격별로 집계 -> 수리중수량
    const repairSheet = ss.getSheetByName(SHEET_REPAIR);
    const repairValues = repairSheet.getDataRange().getValues();
    const repairHeaders = repairValues[0];
    const rSpecCol = repairHeaders.indexOf('제품규격');
    const rQtyCol = repairHeaders.indexOf('수량');
    const rInCol = repairHeaders.indexOf('입고일시');
    const repairingMap = {};
    if (rSpecCol !== -1 && rQtyCol !== -1 && rInCol !== -1) {
      repairValues.slice(1).forEach(r => {
        if (!r[rInCol]) {
          const spec = r[rSpecCol];
          repairingMap[spec] = (repairingMap[spec] || 0) + (Number(r[rQtyCol]) || 0);
        }
      });
    }
    rows.forEach(row => {
      row['수리중수량'] = repairingMap[row['제품규격']] || 0;
    });

    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: 'unknown type' }))
    .setMimeType(ContentService.MimeType.JSON);
}
