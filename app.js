var app = new Vue({
    el: '#app',
    data: function () {
        let generateOptions = function (array) {
            return array.map(_ => ({
                value: _,
                name: _,
            }));
        };
        let years = generateOptions(papers.map(_ => _.year).filter((val, idx, self) => self.indexOf(val) === idx).sort().reverse());
        return {
            papers,
            ccfcats,
            words,
            perPage: 10,
            columns: [{
                    field: 'title',
                    label: 'Title',
                    width: 100,
                    isSearchable: true,
                    customSearch: function (a, input) {
                        input = input || '';
                        let ss = input.split(' ');
                        for (let i = 0; i < ss.length; i++) {
                            const str = ss[i];
                            if (a.title.search(new RegExp(str, "i")) == -1)
                                return false;
                        }
                        return true;
                    },
                },
                {
                    field: 'year',
                    label: 'Year',
                    centered: true,
                    numeric: true,
                    width: 20,
                    isSearchable: true,
                    options: years,
                },
                {
                    field: 'rank',
                    label: 'Rank',
                    centered: true,
                    width: 20,
                    isSearchable: true,
                    options: generateOptions(['Any', 'ABC', 'A', 'B', 'C', 'NotABC']),
                    customSearch: function (a, input) {
                        if (input == "A" || input == "B" || input == "C") {
                            if (a.rank == input) return true;
                            return false;
                        } else if (input == "Any") {
                            return true;
                        } else if (input == "NotABC") {
                            return !a.rank;
                        } else if (input == "ABC") {
                            return a.rank ? true : false;
                        } else {
                            return true;
                        }
                    },
                },
                {
                    field: 'category',
                    label: 'Category',
                    centered: true,
                    width: 20,
                    isSearchable: true,
                    options: ccfcats.map(_ => ({
                        value: _.id.toString(),
                        name: _.title,
                    })),
                    customSearch: function (a, input) {
                        if (!input) return true;
                        return a.category == input;
                    },
                },
            ],
        }
    },
    methods: {
        search(word) {
            let col = this.columns.find(_ => _.field == 'title');
            Vue.set(col, 'filter', word);
        }
    },
    computed: {
        filterPapers() {
            return this.papers.filter(item => {
                for (let i = 0; i < this.columns.length; i++) {
                    const col = this.columns[i];
                    if (col.isSearchable) {
                        if (col.customSearch) {
                            if (!col.customSearch(item, col.filter)) return false;
                        } else if (typeof item[col.field] === 'number') {
                            if (col.filter && item[col.field] != col.filter) return false;
                        } else {
                            if (col.filter && (item[col.field] == null || item[col.field].indexOf(col.filter) == -1)) return false;
                        }
                    }
                }
                return true;
            });
        },
    },
})
// const App = {
//     data() {
//         return {
//             papers,
//             columns: [{
//                     field: 'title',
//                     label: 'tt',
//                 },
//                 {
//                     field: 'year',
//                     label: 'yy',
//                     numeric: true
//                 },
//                 {
//                     field: 'rank',
//                     label: 'rk',
//                     centered: true
//                 },
//                 {
//                     field: 'category',
//                     label: 'c',
//                     centered: true
//                 },
//             ]
//         };
//     },
//     methods: {},
//     computed: {}
// }

// Vue.createApp(App).mount('#app')