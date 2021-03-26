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
            columns: [{
                    field: 'title',
                    label: 'Title',
                    width: 100,
                    searchable: true,
                    search: function (a, input) {
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
                    searchable: true,
                    options: years,
                },
                {
                    field: 'rank',
                    label: 'Rank',
                    centered: true,
                    width: 20,
                    searchable: true,
                    options: generateOptions(['Any', 'ABC', 'A', 'B', 'C', 'NotABC']),
                    search: function (a, input) {
                        if (input == "A" || input == "B" || input == "C") {
                            if (a.rank == input) return true;
                            return false;
                        } else if (input == "Any") {
                            return true;
                        } else if (input == "NotABC") {
                            return !a.rank;
                        } else if (input == "ABC") {
                            return a.rank ? true : false;
                        }
                    },
                },
                {
                    field: 'category',
                    label: 'Category',
                    centered: true,
                    width: 20,
                    searchable: true,
                },
            ],
        }
    },
    methods: {}
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