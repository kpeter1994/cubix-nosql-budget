const { format } = require('date-fns');
const numeral = require('numeral');
const Chart = require('chart.js');
const DatabaseService = require('../services/DatabaseService');
const Item = require("../models/Item");

class ItemController {
    constructor() {
        this.databaseService = new DatabaseService();
        this.chart = null
    }


    init() {
        this.renderItems();
        this.refreshRedisValues('income', 0);
    }


    refreshRedisValues(key, value) {
        const total = document.getElementById('total');

        if (value >= 0) {
            this.databaseService.redisClient.incrByFloat(key, value)
                .then(() => {
                    console.log('Income érték hozzáadva a Redis-hez:', value);
                    return Promise.all([this.databaseService.redisClient.get('income'), this.databaseService.redisClient.get('expense')]);
                })
                .then(([income, expense]) => {
                    const balance = parseFloat(income) - parseFloat(expense);
                    total.innerText = numeral(balance).format('0,0').replace(',',' ');
                })
                .catch(err => console.error('Hiba az income érték hozzáadásakor:', err));
        }

    }


    renderItems() {

        const itemList = document.getElementById('item-list');
        const fetchAllItems = async () => {
            try {
                const items = await this.databaseService.getAllItems();

                itemList.innerHTML = '';




                items.forEach(item => {
                    {

                        itemList.insertAdjacentHTML('beforeend', `
                    <tr class="${item.income > 0 ? 'bg-green-200' : 'bg-red-200' }">
                        <td>${format(item.date, 'yyyy.MM.dd')}</td>
                        <td>${item.title}</td>
                        <td>${numeral(item.expense).format('0,0').replace(',',' ')}</td>
                        <td>${numeral(item.income).format('0,0').replace(',',' ')}</td>
                     </tr>
                    `)
                    }
                })
                this.renderChart();
            } catch (err) {
                console.error('Hiba az elemek lekérdezésekor:', err);
            }
        };


        return fetchAllItems();
    }


    addIncome() {
        const incomeInputTitle = document.getElementById('incomeInputTitle');
        const incomeInputValue = document.getElementById('incomeInputValue');


        const newItem = new Item({
            title: incomeInputTitle.value, income: incomeInputValue.value, expense: 0
        });

        this.databaseService.saveItem(newItem).then(() => {
            this.renderItems()
        }).catch(err => console.error('Hiba az elem mentésekor:', err));

        this.refreshRedisValues('income', incomeInputValue.value);


        incomeInputTitle.value = '';
        incomeInputValue.value = '';

    }

    addExpense() {
        const expenseInputTitle = document.getElementById('expenseInputTitle');
        const expenseInputValue = document.getElementById('expenseInputValue');


        const newItem = new Item({
            title: expenseInputTitle.value, income: 0, expense: expenseInputValue.value,
        });

        this.databaseService.saveItem(newItem).then(() => {
            this.renderItems()
        }).catch(err => console.error('Hiba az elem mentésekor:', err));

        this.refreshRedisValues('expense', expenseInputValue.value);


        expenseInputTitle.value = '';
        expenseInputValue.value = '';

    }

    renderChart() {
        const ctx = document.getElementById('myChart').getContext('2d');


        Promise.all([
            this.databaseService.redisClient.get('income'),
            this.databaseService.redisClient.get('expense')
        ]).then(([income, expense]) => {
            const totalIncome = parseFloat(income) || 0;
            const totalExpense = parseFloat(expense) || 0;

            const maxValue = Math.max(totalIncome, totalExpense) * 1.5;


            if (this.chart) {
                this.chart.destroy();
            }


            this.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Bevételek', 'Kiadások'],
                    datasets: [{
                        label: 'Összesen',
                        data: [totalIncome, totalExpense],
                        backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return numeral(context.raw).format('0,0').replace(',', ' ') + ' Ft';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            min: 0,
                            max: maxValue
                        }
                    }
                }
            });
        }).catch(err => console.error('Hiba a Redis adatok lekérdezésekor:', err));
    }


}

module.exports = ItemController;



