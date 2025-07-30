/**
 * Функция для расчета прибыли
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет прибыли от операции
   const {discount, sale_price, quantity} = purchase;
   const discountDec = 1 - (discount/100);
   return (sale_price*quantity)*discountDec;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const {profit} = seller;
    let bonus=0;
    if (index===0){
        bonus=profit*0.15;
    } else if(index===1||index===2) {
        bonus=profit*0.1;
    } else if(index>2&&index<total-1) {
        bonus=profit*0.05;
    } else {
        bonus = 0;
    }
    return bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const condition1 = !Array.isArray(data.sellers)
                        &&!Array.isArray(data.products)
                        &&!Array.isArray(data.customers);
    const condition2 = data.sellers.length===0
                        &&data.products.length===0
                        &&data.customers.length===0;

    if (!data 
        || condition1 
        || condition2){
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    const {calculateRevenue, calculateBonus} = options;

    if (!calculateRevenue || !calculateBonus) {
        throw new Error('Чего-то не хватает');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {}
    }));


    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count++;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price*item.quantity;
            const revenue = calculateRevenue(item);
            seller.revenue+=revenue;
            seller.profit+=revenue-cost;
            if(!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku]+=item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((first, second) => second.profit - first.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
        seller.bonus = calculateBonus(index,sellerStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold).map(value => ({
            sku: value[0],
            quantity: value[1]
        })).sort((first, second) => second.quantity - first.quantity)
        .slice(0,10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus.toFixed(2)
    }));
}