/* ================= 9.0: phones side by side — official specs and launch prices (checked October 2026) ================= */
/* d: display ", hz: refresh, chip, ram GB (0 = not published), st: base storage GB, cam: rear cameras MP, bat: mAh (0 = not published), w: wired W, g: grams,
   pr: [launch price, currency, country], rel: launch month, src: where the figures come from */
var PHONES = {
  at: '2026-10-16',
  list: [
    {id: 'ip18p', b: 'apple', n: 'iPhone 18 Pro', d: 6.3, hz: 120, chip: 'A20 Pro', ram: 12, st: 256, cam: [48, 48, 48], bat: 4056, w: 0, g: 211, ip: 'IP68', pr: [1199, 'USD', 'US'], rel: '2026-09', src: 'Apple / MacRumors'},
    {id: 'ip18pm', b: 'apple', n: 'iPhone 18 Pro Max', d: 6.9, hz: 120, chip: 'A20 Pro', ram: 12, st: 256, cam: [48, 48, 48], bat: 5391, w: 0, g: 249, ip: 'IP68', pr: [1299, 'USD', 'US'], rel: '2026-09', src: 'Apple / MacRumors'},
    {id: 'ipduo', b: 'apple', n: 'iPhone Duo', d: 7.6, hz: 120, chip: 'A20 Pro', ram: 0, st: 256, cam: [48, 48], bat: 0, w: 0, g: 254, ip: 'IP68', pr: [1999, 'USD', 'US'], rel: '2026-10', src: 'Apple / iGeeksBlog'},
    {id: 'ipair', b: 'apple', n: 'iPhone Air', d: 6.5, hz: 120, chip: 'A19 Pro', ram: 12, st: 256, cam: [48], bat: 3149, w: 0, g: 165, ip: 'IP68', pr: [999, 'USD', 'US'], rel: '2025-09', src: 'PhoneArena'},
    {id: 'ip17', b: 'apple', n: 'iPhone 17', d: 6.3, hz: 120, chip: 'A19', ram: 8, st: 256, cam: [48, 48], bat: 3692, w: 0, g: 177, ip: 'IP68', pr: [799, 'USD', 'US'], rel: '2025-09', src: 'PhoneArena'},
    {id: 'ip17p', b: 'apple', n: 'iPhone 17 Pro', d: 6.3, hz: 120, chip: 'A19 Pro', ram: 12, st: 256, cam: [48, 48, 48], bat: 3988, w: 0, g: 206, ip: 'IP68', pr: [1099, 'USD', 'US'], rel: '2025-09', src: 'Apple / MacRumors'},
    {id: 'ip17pm', b: 'apple', n: 'iPhone 17 Pro Max', d: 6.9, hz: 120, chip: 'A19 Pro', ram: 12, st: 256, cam: [48, 48, 48], bat: 4823, w: 0, g: 233, ip: 'IP68', pr: [1199, 'USD', 'US'], rel: '2025-09', src: 'Apple / MacRumors'},
    {id: 'ip17e', b: 'apple', n: 'iPhone 17e', d: 6.1, hz: 60, chip: 'A19', ram: 8, st: 256, cam: [48], bat: 4005, w: 0, g: 169, ip: 'IP68', pr: [599, 'USD', 'US'], rel: '2026-03', src: 'PhoneArena'},
    {id: 'ip16', b: 'apple', n: 'iPhone 16', d: 6.1, hz: 60, chip: 'A18', ram: 8, st: 128, cam: [48, 12], bat: 3561, w: 0, g: 170, ip: 'IP68', pr: [799, 'USD', 'US'], rel: '2024-09', src: 'Apple'},
    {id: 'ip16plus', b: 'apple', n: 'iPhone 16 Plus', d: 6.7, hz: 60, chip: 'A18', ram: 8, st: 128, cam: [48, 12], bat: 4674, w: 0, g: 199, ip: 'IP68', pr: [899, 'USD', 'US'], rel: '2024-09', src: 'Apple'},
    {id: 'ip16p', b: 'apple', n: 'iPhone 16 Pro', d: 6.3, hz: 120, chip: 'A18 Pro', ram: 8, st: 128, cam: [48, 48, 12], bat: 3582, w: 0, g: 199, ip: 'IP68', pr: [999, 'USD', 'US'], rel: '2024-09', src: 'Apple'},
    {id: 'ip16pm', b: 'apple', n: 'iPhone 16 Pro Max', d: 6.9, hz: 120, chip: 'A18 Pro', ram: 8, st: 256, cam: [48, 48, 12], bat: 4685, w: 0, g: 227, ip: 'IP68', pr: [1199, 'USD', 'US'], rel: '2024-09', src: 'Apple'},
    {id: 'ip16e', b: 'apple', n: 'iPhone 16e', d: 6.1, hz: 60, chip: 'A18', ram: 8, st: 128, cam: [48], bat: 4005, w: 0, g: 167, ip: 'IP68', pr: [599, 'USD', 'US'], rel: '2025-02', src: 'PhoneArena'},
    {id: 's26', b: 'samsung', n: 'Galaxy S26', d: 6.3, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 12, 10], bat: 4300, w: 25, g: 167, ip: 'IP68', pr: [899.99, 'USD', 'US'], rel: '2026-03', src: 'Android Authority'},
    {id: 's26plus', b: 'samsung', n: 'Galaxy S26+', d: 6.7, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 12, 10], bat: 4900, w: 45, g: 190, ip: 'IP68', pr: [1099.99, 'USD', 'US'], rel: '2026-03', src: 'Android Authority'},
    {id: 's26u', b: 'samsung', n: 'Galaxy S26 Ultra', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [200, 50, 50, 10], bat: 5000, w: 60, g: 214, ip: 'IP68', pr: [1299.99, 'USD', 'US'], rel: '2026-03', src: 'Android Authority'},
    {id: 's25', b: 'samsung', n: 'Galaxy S25', d: 6.2, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 128, cam: [50, 12, 10], bat: 4000, w: 25, g: 162, ip: 'IP68', pr: [799.99, 'USD', 'US'], rel: '2025-02', src: 'Samsung'},
    {id: 's25plus', b: 'samsung', n: 'Galaxy S25+', d: 6.7, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [50, 12, 10], bat: 4900, w: 45, g: 190, ip: 'IP68', pr: [999.99, 'USD', 'US'], rel: '2025-02', src: 'Samsung'},
    {id: 's25u', b: 'samsung', n: 'Galaxy S25 Ultra', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [200, 50, 50, 10], bat: 5000, w: 45, g: 218, ip: 'IP68', pr: [1299.99, 'USD', 'US'], rel: '2025-02', src: 'Samsung'},
    {id: 's25edge', b: 'samsung', n: 'Galaxy S25 Edge', d: 6.7, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [200, 12], bat: 3900, w: 25, g: 163, ip: 'IP68', pr: [1099.99, 'USD', 'US'], rel: '2025-05', src: 'PhoneArena'},
    {id: 's25fe', b: 'samsung', n: 'Galaxy S25 FE', d: 6.7, hz: 120, chip: 'Exynos 2400', ram: 8, st: 128, cam: [50, 12, 8], bat: 4900, w: 45, g: 190, ip: 'IP68', pr: [649.99, 'USD', 'US'], rel: '2025-09', src: 'PhoneArena'},
    {id: 's24fe', b: 'samsung', n: 'Galaxy S24 FE', d: 6.7, hz: 120, chip: 'Exynos 2400e', ram: 8, st: 128, cam: [50, 8, 12], bat: 4700, w: 25, g: 213, ip: 'IP68', pr: [649.99, 'USD', 'US'], rel: '2024-10', src: 'Samsung'},
    {id: 'fold8u', b: 'samsung', n: 'Galaxy Z Fold8 Ultra', d: 8.0, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [200, 50, 10], bat: 5000, w: 45, g: 215, ip: 'IP48', pr: [2099, 'USD', 'US'], rel: '2026-08', src: 'SamMobile / Finder'},
    {id: 'fold8', b: 'samsung', n: 'Galaxy Z Fold8', d: 7.6, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 50], bat: 4800, w: 45, g: 201, ip: 'IP48', pr: [1899, 'USD', 'US'], rel: '2026-08', src: 'TechRepublic / Finder'},
    {id: 'flip8', b: 'samsung', n: 'Galaxy Z Flip8', d: 6.9, hz: 120, chip: 'Exynos 2600', ram: 12, st: 256, cam: [50, 12], bat: 4300, w: 25, g: 180, ip: 'IP48', pr: [1199, 'USD', 'US'], rel: '2026-08', src: 'SamMobile / Finder'},
    {id: 'fold7', b: 'samsung', n: 'Galaxy Z Fold7', d: 8.0, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [200, 12, 10], bat: 4400, w: 25, g: 215, ip: 'IP48', pr: [1999.99, 'USD', 'US'], rel: '2025-07', src: 'Samsung'},
    {id: 'flip7', b: 'samsung', n: 'Galaxy Z Flip7', d: 6.9, hz: 120, chip: 'Exynos 2500', ram: 12, st: 256, cam: [50, 12], bat: 4300, w: 25, g: 188, ip: 'IP48', pr: [1099.99, 'USD', 'US'], rel: '2025-07', src: 'Samsung'},
    {id: 'flip7fe', b: 'samsung', n: 'Galaxy Z Flip7 FE', d: 6.7, hz: 120, chip: 'Exynos 2400', ram: 8, st: 128, cam: [50, 12], bat: 4000, w: 25, g: 187, ip: 'IP48', pr: [899.99, 'USD', 'US'], rel: '2025-07', src: 'PhoneArena'},
    {id: 'a57', b: 'samsung', n: 'Galaxy A57', d: 6.7, hz: 120, chip: 'Exynos 1680', ram: 8, st: 128, cam: [50, 12, 5], bat: 5000, w: 45, g: 179, ip: 'IP68', pr: [549.99, 'USD', 'US'], rel: '2026-04', src: 'TechRadar'},
    {id: 'a37', b: 'samsung', n: 'Galaxy A37', d: 6.7, hz: 120, chip: 'Exynos 1480', ram: 6, st: 128, cam: [50, 8, 5], bat: 5000, w: 45, g: 196, ip: 'IP68', pr: [449.99, 'USD', 'US'], rel: '2026-04', src: 'TechRadar'},
    {id: 'a56', b: 'samsung', n: 'Galaxy A56', d: 6.7, hz: 120, chip: 'Exynos 1580', ram: 8, st: 128, cam: [50, 12, 5], bat: 5000, w: 45, g: 198, ip: 'IP67', pr: [499.99, 'USD', 'US'], rel: '2025-03', src: 'PhoneArena'},
    {id: 'a36', b: 'samsung', n: 'Galaxy A36', d: 6.7, hz: 120, chip: 'Snapdragon 6 Gen 3', ram: 6, st: 128, cam: [50, 8, 5], bat: 5000, w: 45, g: 195, ip: 'IP67', pr: [399.99, 'USD', 'US'], rel: '2025-03', src: 'PhoneArena'},
    {id: 'a26', b: 'samsung', n: 'Galaxy A26', d: 6.7, hz: 120, chip: 'Exynos 1380', ram: 6, st: 128, cam: [50, 8, 2], bat: 5000, w: 25, g: 200, ip: 'IP67', pr: [299.99, 'USD', 'US'], rel: '2025-03', src: 'PhoneArena'},
    {id: 'a17', b: 'samsung', n: 'Galaxy A17 5G', d: 6.7, hz: 90, chip: 'Exynos 1330', ram: 4, st: 128, cam: [50, 5, 2], bat: 5000, w: 25, g: 192, ip: 'IP54', pr: [199.99, 'USD', 'US'], rel: '2025-08', src: 'SamMobile / Kimovil'},
    {id: 'a16', b: 'samsung', n: 'Galaxy A16 5G', d: 6.7, hz: 90, chip: 'Exynos 1330', ram: 4, st: 128, cam: [50, 5, 2], bat: 5000, w: 25, g: 200, ip: 'IP54', pr: [199.99, 'USD', 'US'], rel: '2024-10', src: 'PhoneArena'},
    {id: 'a07', b: 'samsung', n: 'Galaxy A07', d: 6.7, hz: 90, chip: 'Helio G99', ram: 4, st: 64, cam: [50, 2], bat: 5000, w: 25, g: 184, ip: 'IP54', pr: [8999, 'INR', 'IN'], rel: '2025-08', src: 'Techlusive'},
    {id: 'x17', b: 'xiaomi', n: 'Xiaomi 17', d: 6.3, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 50, 50], bat: 6330, w: 100, g: 191, ip: 'IP68', pr: [999, 'EUR', 'EU'], rel: '2026-03', src: 'PhoneArena / WhatMobile'},
    {id: 'x17p', b: 'xiaomi', n: 'Xiaomi 17 Pro', d: 6.3, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 50, 50], bat: 6300, w: 100, g: 192, ip: 'IP68', pr: [4999, 'CNY', 'CN'], rel: '2025-09', src: 'PhoneArena'},
    {id: 'x17pm', b: 'xiaomi', n: 'Xiaomi 17 Pro Max', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 512, cam: [50, 50, 50], bat: 7500, w: 100, g: 219, ip: 'IP68', pr: [5999, 'CNY', 'CN'], rel: '2025-09', src: 'GSMArena'},
    {id: 'x17u', b: 'xiaomi', n: 'Xiaomi 17 Ultra', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 16, st: 512, cam: [50, 50, 200], bat: 6000, w: 90, g: 218, ip: 'IP68', pr: [1499, 'EUR', 'EU'], rel: '2026-03', src: 'GSMArena'},
    {id: 'x17t', b: 'xiaomi', n: 'Xiaomi 17T', d: 6.59, hz: 120, chip: 'Dimensity 8500 Ultra', ram: 12, st: 256, cam: [50, 50, 12], bat: 6500, w: 67, g: 200, ip: 'IP68', pr: [749, 'EUR', 'EU'], rel: '2026-05', src: 'GSMArena / Notebookcheck'},
    {id: 'x17tp', b: 'xiaomi', n: 'Xiaomi 17T Pro', d: 6.83, hz: 144, chip: 'Dimensity 9500', ram: 12, st: 512, cam: [50, 50, 12], bat: 7000, w: 100, g: 219, ip: 'IP68', pr: [999, 'EUR', 'EU'], rel: '2026-05', src: 'Notebookcheck / PhoneArena'},
    {id: 'x15', b: 'xiaomi', n: 'Xiaomi 15', d: 6.36, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [50, 50, 50], bat: 5240, w: 90, g: 191, ip: 'IP68', pr: [999, 'EUR', 'EU'], rel: '2025-03', src: 'Notebookcheck'},
    {id: 'x15u', b: 'xiaomi', n: 'Xiaomi 15 Ultra', d: 6.73, hz: 120, chip: 'Snapdragon 8 Elite', ram: 16, st: 512, cam: [50, 50, 50, 200], bat: 5410, w: 90, g: 226, ip: 'IP68', pr: [1499, 'EUR', 'EU'], rel: '2025-03', src: 'Revu'},
    {id: 'x15t', b: 'xiaomi', n: 'Xiaomi 15T', d: 6.83, hz: 120, chip: 'Dimensity 8400 Ultra', ram: 12, st: 256, cam: [50, 50, 12], bat: 5500, w: 67, g: 194, ip: 'IP68', pr: [649, 'EUR', 'EU'], rel: '2025-09', src: 'PhoneArena'},
    {id: 'x15tp', b: 'xiaomi', n: 'Xiaomi 15T Pro', d: 6.83, hz: 144, chip: 'Dimensity 9400+', ram: 12, st: 256, cam: [50, 50, 12], bat: 5500, w: 90, g: 210, ip: 'IP68', pr: [799, 'EUR', 'EU'], rel: '2025-09', src: 'PhoneArena'},
    {id: 'x14t', b: 'xiaomi', n: 'Xiaomi 14T', d: 6.67, hz: 144, chip: 'Dimensity 8300 Ultra', ram: 12, st: 256, cam: [50, 50, 12], bat: 5000, w: 67, g: 193, ip: 'IP68', pr: [649, 'EUR', 'EU'], rel: '2024-09', src: 'Xiaomi'},
    {id: 'x14tp', b: 'xiaomi', n: 'Xiaomi 14T Pro', d: 6.67, hz: 144, chip: 'Dimensity 9300+', ram: 12, st: 256, cam: [50, 50, 12], bat: 5000, w: 120, g: 209, ip: 'IP68', pr: [799, 'EUR', 'EU'], rel: '2024-09', src: 'Xiaomi'},
    {id: 'rn15', b: 'xiaomi', n: 'Redmi Note 15 5G', d: 6.77, hz: 120, chip: 'Snapdragon 6 Gen 3', ram: 6, st: 128, cam: [108, 8], bat: 5520, w: 45, g: 178, ip: '', pr: [279, 'EUR', 'EU'], rel: '2026-01', src: 'Unbox PH / GSMArena'},
    {id: 'rn15p', b: 'xiaomi', n: 'Redmi Note 15 Pro 5G', d: 6.83, hz: 120, chip: 'Dimensity 7400 Ultra', ram: 8, st: 256, cam: [200, 8], bat: 6580, w: 45, g: 210, ip: 'IP68', pr: [399, 'EUR', 'EU'], rel: '2026-01', src: 'Notebookcheck / GSMArena'},
    {id: 'rn15pp', b: 'xiaomi', n: 'Redmi Note 15 Pro+ 5G', d: 6.83, hz: 120, chip: 'Snapdragon 7s Gen 4', ram: 8, st: 256, cam: [200, 8], bat: 6500, w: 100, g: 207, ip: 'IP68', pr: [499, 'EUR', 'EU'], rel: '2026-01', src: 'GSMArena'},
    {id: 'r15', b: 'xiaomi', n: 'Redmi 15', d: 6.9, hz: 144, chip: 'Snapdragon 685', ram: 6, st: 128, cam: [50], bat: 7000, w: 33, g: 224, ip: 'IP64', pr: [159, 'GBP', 'UK'], rel: '2025-08', src: 'GSMArena / Notebookcheck'},
    {id: 'r15c', b: 'xiaomi', n: 'Redmi 15C', d: 6.9, hz: 120, chip: 'Helio G81 Ultra', ram: 4, st: 128, cam: [50], bat: 6000, w: 33, g: 205, ip: 'IP64', pr: [119, 'USD', 'Global'], rel: '2025-08', src: 'GSMArena / FoneArena'},
    {id: 'pocof8u', b: 'xiaomi', n: 'POCO F8 Ultra', d: 6.9, hz: 120, chip: 'Snapdragon 8 Elite Gen 5', ram: 12, st: 256, cam: [50, 50, 50], bat: 6500, w: 100, g: 218, ip: 'IP68', pr: [729, 'USD', 'Global'], rel: '2025-11', src: 'PhoneArena / 91mobiles'},
    {id: 'pocof8p', b: 'xiaomi', n: 'POCO F8 Pro', d: 6.59, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [50, 50, 8], bat: 6210, w: 100, g: 199, ip: 'IP68', pr: [579, 'USD', 'Global'], rel: '2025-11', src: 'PhoneArena / 91mobiles'},
    {id: 'pocof7', b: 'xiaomi', n: 'POCO F7', d: 6.83, hz: 120, chip: 'Snapdragon 8s Gen 4', ram: 12, st: 256, cam: [50, 8], bat: 6500, w: 90, g: 215, ip: 'IP68', pr: [399, 'USD', 'Global'], rel: '2025-06', src: 'PhoneArena'},
    {id: 'pocof7p', b: 'xiaomi', n: 'POCO F7 Pro', d: 6.67, hz: 120, chip: 'Snapdragon 8 Gen 3', ram: 12, st: 256, cam: [50, 8], bat: 6000, w: 90, g: 206, ip: 'IP68', pr: [499, 'USD', 'Global'], rel: '2025-03', src: 'Smartprix / PhoneArena'},
    {id: 'pocof7u', b: 'xiaomi', n: 'POCO F7 Ultra', d: 6.67, hz: 120, chip: 'Snapdragon 8 Elite', ram: 12, st: 256, cam: [50, 50, 32], bat: 5300, w: 120, g: 212, ip: 'IP68', pr: [649, 'USD', 'Global'], rel: '2025-03', src: 'Smartprix'},
    {id: 'pocox7p', b: 'xiaomi', n: 'POCO X7 Pro', d: 6.67, hz: 120, chip: 'Dimensity 8400 Ultra', ram: 8, st: 256, cam: [50, 8], bat: 6000, w: 90, g: 195, ip: 'IP68', pr: [27999, 'INR', 'IN'], rel: '2025-01', src: 'Kimovil'},
    {id: 'pocox8p', b: 'xiaomi', n: 'POCO X8 Pro', d: 6.59, hz: 120, chip: 'Dimensity 8500 Ultra', ram: 8, st: 256, cam: [50, 8], bat: 6500, w: 100, g: 201, ip: 'IP68', pr: [349, 'GBP', 'UK'], rel: '2026-03', src: 'MobileMasr'},
    {id: 'pocox8pm', b: 'xiaomi', n: 'POCO X8 Pro Max', d: 6.83, hz: 120, chip: 'Dimensity 9500s', ram: 12, st: 256, cam: [50, 8], bat: 8500, w: 100, g: 218, ip: 'IP68', pr: [469, 'GBP', 'UK'], rel: '2026-03', src: 'PhoneArena / MobileMasr'},
    {id: 'px11xl', b: 'google', n: 'Pixel 11 Pro XL', d: 6.8, hz: 120, chip: 'Tensor G6 (2nm)', ram: 16, st: 128, cam: [50, 48, 48], bat: 5115, w: 45, g: 0, ip: 'IP68', pr: [134999, 'INR', 'IN'], rel: '2026-08', src: 'MySmartPrice'},
    {id: 'px11p', b: 'google', n: 'Pixel 11 Pro', d: 6.3, hz: 120, chip: 'Tensor G6 (2nm)', ram: 16, st: 128, cam: [50, 48, 48], bat: 4850, w: 30, g: 0, ip: 'IP68', pr: [119999, 'INR', 'IN'], rel: '2026-08', src: 'MySmartPrice'},
    {id: 'px11', b: 'google', n: 'Pixel 11', d: 6.3, hz: 120, chip: 'Tensor G6 (2nm)', ram: 12, st: 128, cam: [48, 13, 10.8], bat: 4985, w: 30, g: 0, ip: 'IP68', pr: [89999, 'INR', 'IN'], rel: '2026-08', src: 'MySmartPrice'}
  ]
};
function phMine(){ if (!SET.phPrice || typeof SET.phPrice !== 'object') SET.phPrice = {}; return SET.phPrice; }
/* the price in shekels: what you typed (a real Israeli price), or the launch price converted at today's rate (marked as an estimate) */
function phIls(p){
  const own = +phMine()[p.id]; if (own > 0) return {v: own, own: 1};
  const [x, c] = p.pr; if (!(x > 0) || !RATES[c] || !RATES.ILS) return {v: NaN};
  return {v: x * RATES.ILS / RATES[c], own: 0};
}
const phById = id => PHONES.list.find(p => p.id === id);
const phCam = p => p.cam.length + ' · ' + p.cam.map(x => N(x, x % 1 ? 1 : 0)).join('+') + 'MP';
function phScore(p, by){
  const pr = phIls(p).v;
  if (by === 'price') return isFinite(pr) ? -pr : -1e9;
  if (by === 'battery') return (p.bat || 0) + (p.w || 0) * 10;
  if (by === 'camera') return Math.max(...p.cam) / 4 + p.cam.length * 40 + (p.cam.length > 2 ? 30 : 0);
  if (by === 'small') return -(p.d * 100 + (p.g || 200) / 2);
  if (by === 'big') return p.d * 100 + p.hz;
  /* balanced: the specs per shekel */
  const spec = (p.bat || 4500) / 50 + p.cam.length * 25 + Math.max(...p.cam) / 4 + (p.ram || 8) * 6 + p.hz / 2 + p.st / 8 + (p.w || 20) / 2;
  return isFinite(pr) && pr > 0 ? spec * spec / Math.sqrt(pr) / 100 : spec / 10;      // good specs count more than a low price alone
}
function calcPhoneCmp(){
  const by = ($('#ph_by') || {}).value || 'balanced', brand = ($('#ph_brand') || {}).value || 'all', budget = Math.max(0, v('ph_budget'));
  const pick = ['ph_a', 'ph_b', 'ph_c'].map(id => ($('#' + id) || {}).value).filter(x => x && x !== 'none').map(phById).filter(Boolean);
  let L = PHONES.list.filter(p => brand === 'all' || p.b === brand);
  if (budget > 0) L = L.filter(p => { const x = phIls(p).v; return !isFinite(x) || x <= budget; });
  const S = L.slice().sort((a, b) => phScore(b, by) - phScore(a, by));
  const pr = p => { const x = phIls(p); return isFinite(x.v) ? (x.own ? '' : '≈') + M(x.v) : '—'; };
  const note = t('n_ph', {d: PHONES.at});
  const best = S[0];
  /* the phones you picked, side by side */
  const cmp = pick.length >= 2 ? pick : S.slice(0, 3);
  const spec = [[t('ph_price'), p => pr(p)], [t('ph_launch'), p => p.pr[0] > 0 ? N(p.pr[0], 0) + ' ' + p.pr[1] + ' (' + p.pr[2] + ')' : t('ph_na')], [t('ph_screen'), p => N(p.d, 1) + '″ · ' + p.hz + 'Hz'],
    [t('ph_chip'), p => p.chip], [t('ph_ram'), p => p.ram ? p.ram + 'GB' : t('ph_na')], [t('ph_storage'), p => p.st >= 1000 ? p.st / 1024 + 'TB' : p.st + 'GB'], [t('ph_cam'), phCam],
    [t('ph_bat'), p => p.bat ? N(p.bat, 0) + ' mAh' : t('ph_na')], [t('ph_charge'), p => p.w ? p.w + 'W' : t('ph_na')], [t('ph_weight'), p => p.g ? p.g + 'g' : t('ph_na')], [t('ph_water'), p => p.ip || '—'], [t('ph_rel'), p => p.rel]];
  const rows = [];
  if (best) rows.push([t('ph_bestBy', {b: t('o_ph_' + by)}), best.n + ' · ' + pr(best), 'key']);
  S.slice(1, 5).forEach((p, i) => rows.push([(i + 2) + '. ' + p.n, pr(p)]));
  rows.push([t('ph_count', {n: S.length, a: PHONES.list.length}), '']);
  const warn = [];
  if (cmp.some(p => !phIls(p).own)) warn.push(t('w_phEst'));
  return {
    hero: best ? {label: t('ph_hero', {b: t('o_ph_' + by)}), value: best.n, sub: pr(best) + ' · ' + N(best.d, 1) + '″ · ' + (best.bat ? N(best.bat, 0) + ' mAh · ' : '') + phCam(best)} : {label: t('ph_none'), value: '—'},
    rows, warn,
    table2: {title: t('t_phSide'), open: true, head: [''].concat(cmp.map(p => p.n)), rows: spec.map(([lab, f]) => ({c: [lab].concat(cmp.map(f))}))},
    table: {title: t('t_phAll'), head: ['', t('ph_price'), t('ph_screen'), t('ph_bat'), t('ph_cam'), t('ph_chip')], rows: S.map(p => [p.n, pr(p), N(p.d, 1) + '″', p.bat ? N(p.bat, 0) : '—', phCam(p), p.chip])},
    note
  };
}
Object.assign(CALC, {phonecmp: calcPhoneCmp});
