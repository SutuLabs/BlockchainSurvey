var app = new Vue({
    el: '#app',
    data: {
        papers,
        columns: [{
                field: 'title',
                label: 'tt',
                width: 100,
                searchable: true,
            },
            {
                field: 'year',
                label: 'yy',
                numeric: true,
                width: 20,
                searchable: true,
            },
            {
                field: 'rank',
                label: 'rk',
                centered: true,
                width: 20,
                searchable: true,
                options: [
                    {value: "A", name:"A",},
                    {value: "B", name:"B",},
                    {value: "C", name:"C",},
                    {value: "", name:"Any",},
                    {value: "", name:"Any",},
                ],
            },
            {
                field: 'category',
                label: 'c',
                centered: true,
                width: 20,
                searchable: true,
            },
        ]
    }
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