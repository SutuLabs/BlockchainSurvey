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
        let simplifyPublisher = function (name) {
            if (!name) return name;
            let ss = name.split(' ');
            return ss.map(_ => _[0]).join('');
        };
        let pps = papers.map(_ => Object.assign({}, {
            pub: simplifyPublisher(_.publisher)
        }, _))
        return {
            papers: pps,
            ccfcats,
            perPage: 10,
            isKeywordOpen: false,
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
        },
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
        words() {
            const NotCountWords = ["based", "using", "enabled", "via", "novel", ];
            const NonLexicalWords = ["the", "of", "and", "to", "a", "in", "for", "is", "on", "that", "by", "this", "with", "i", "you", "it", "not", "or", "be", "are", "from", "at", "as", "your", "all", "have", "new", "more", "an", "was", "we", "will", "home", "can", "us", "about", "if", "page", "my", "has", "free", "but", "our", "one", "other", "do", "no", "information", "time", "they", "site", "he", "up", "may", "what", "which", "their", "news", "out", "use", "any", "there", "see", "only", "so", "his", "when", "contact", "here", "business", "who", "web", "also", "now", "help", "get", "pm", "view", "online", "c", "e", "first", "am", "been", "would", "how", "were", "me", "s", "services", "some", "these", "click", "its", "like", "service", "x", "than", "find", "price", "date", "back", "top", "people", "had", "list", "name", "just", "over", "state", "year", "day", "into", "email", "two", "health", "n", "world", "re", "next", "used", "go", "b", "work", "last", "most", "products", "music", "buy", "make", "them", "should", "product", "post", "her", "city", "t", "add", "policy", "number", "such", "please", "available", "copyright", "support", "message", "after", "best", "software", "then", "jan", "good", "video", "well", "d", "where", "info", "rights", "public", "books", "high", "school", "through", "m", "each", "links", "she", "review", "years", "order", "very", "privacy", "book", "items", "company", "r", "read", "group", "sex", "need", "many", "user", "said", "de", "does", "set", "under", "general", "research", "university", "january", "mail", "full", "map", "reviews", "program", "life"];
            let split = (input) => input.match(/\b[\w']+\b/g);
            let ws = this.filterPapers.map(_ => split(_.title)).reduce((a, b) => a.concat(b));
            let groupBy = function (xs) {
                return xs.reduce(function (rv, x) {
                    (rv[x] = rv[x] || []).push(x);
                    return rv;
                }, {});
            };
            let cleanWords = ws.map(_ => _.toLowerCase())
                .filter(_ => _)
                .filter(_ => NonLexicalWords.indexOf(_) == -1)
                .filter(_ => NotCountWords.indexOf(_) == -1)
                .filter(_ => _.indexOf('blockchain') == -1);
            let groups = groupBy(cleanWords);
            let wordsStats = Object.keys(groups)
                .map(_ => ({
                    Word: _,
                    Count: groups[_].length
                }))
                .filter(_ => _.Count > 1)
                .sort((a, b) => a.Count > b.Count ? -1 : 1)
                .slice(0, 40);

            return wordsStats;
        }
    },
})