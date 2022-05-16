Array.prototype.groupBy = function () {
    let dict = this.reduce(function (rv, x) {
        (rv[x] = rv[x] || []).push(x);
        return rv;
    }, {});
    return Object.keys(dict)
        .map(_ => ({
            key: _,
            values: dict[_]
        }))
};

function CsvtoArray(text) {

    // https://stackoverflow.com/a/8497474
    // Return array of string values, or NULL if CSV string not well formed.
    function CsvLinetoArray(text) {
        var re_valid =
            /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
        var re_value =
            /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
        // Return NULL if input string is not well formed CSV string.
        if (!re_valid.test(text)) return null;
        var a = []; // Initialize array to receive values.
        text.replace(re_value, // "Walk" the string using replace with callback.
            function (m0, m1, m2, m3) {
                // Remove backslash from \' in single quoted values.
                if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                else if (m3 !== undefined) a.push(m3);
                return ''; // Return empty string.
            });
        // Handle special case of empty last value.
        if (/,\s*$/.test(text)) a.push('');
        return a;
    };

    const lines = text.split('\n');
    let ops = [];
    for (var i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.trim() == '') continue;

        const carr = CsvLinetoArray(line);
        if (carr == null) {
            console.error("malformat of csv: ", line);
        }

        ops.push(carr);
    }
    return ops;
}
var app = new Vue({
    el: '#app',
    data: function () {
        let notes = JSON.parse(localStorage.getItem("NOTES") || JSON.stringify({}));

        return {
            papers: null,
            ccfcats: [],
            ccf: [],
            isKeywordOpen: false,
            isOutputOpen: false,
            notes,
            tags: [],
            columns: [],
            stats: null,
            filename: null,
            perPage: 10,
            noteExist: null,
            activeTab: 0,
            patents: null,
            patent: null,
            online: {
                papers: [],
                total: 0,
                loading: false,
                sortField: 'title',
                sortOrder: 'desc',
                defaultSortOrder: 'desc',
                page: 1,
                inputTimeout: 0,
                columns: [],
            }
        }
    },
    mounted: async function () {
        const categoryCsv = await fetch("category.csv");
        this.ccfcats = CsvtoArray(await categoryCsv.text()).map(_ => ({
            id: _[0],
            icon: _[1],
            title: _[2],
            url: _[3],
        })).slice(1);
        const ccf2019Csv = await fetch("ccf2019.csv");
        const reDblp = /http[s]?:\/\/dblp\.uni-trier\.de\/db\/((conf|journals){1}\/.*?(\/|$))(index.html)?/;
        const getCrossRef = function (url) {
            const m1 = url.match(reDblp);
            if (m1) {
                return m1[1];
            }

            // console.error("cannot parse url: ", url);
            return undefined;
        }
        this.ccf = CsvtoArray(await ccf2019Csv.text()).map(_ => ({
            id: _[0],
            title: _[1],
            fulname: _[2],
            publisher: _[3],
            url: _[4],
            rank: _[5],
            type: _[6],
            category: _[7],
            crossref: getCrossRef(_[4]),
        })).slice(1);

        const paperType = "remote";
        let findccf = (key) => this.ccf.find(_ => key && key.startsWith(_.crossref)) || {};
        let generateOptions = function (array) {
            return array.map(_ => ({
                value: _,
                name: _,
            }));
        };
        if (paperType == "local") {
            const response = await fetch("paper.bin");
            const paperbin = (await response.blob()).stream();
            const records = await MessagePack.decodeAsync(paperbin);
            const papers = {
                records
            };

            let years = generateOptions(papers.records.map(_ => _.year).filter((val, idx, self) => self.indexOf(val) === idx).sort().reverse());
            let pps = papers.records.map(_ => Object.assign({}, {
                pub: (_.publisher || '').replace(/[^A-Z]/g, ''),
                rank: findccf(_.key).rank,
                category: findccf(_.key).category,
            }, _))
            let columns = [{
                    field: 'title',
                    label: 'Title',
                    width: 100,
                    isSearchable: true,
                    sortable: true,
                    customSearch: function (a, input) {
                        input = input || '';
                        let ss = input.split(' ');
                        a.highlight = a.title;
                        for (let i = 0; i < ss.length; i++) {
                            const str = ss[i];
                            if (str == '') continue;
                            if (str.startsWith('-')) {
                                const kw = str.substr(1);
                                if (kw == '') continue;
                                if (a.title.search(new RegExp(kw, "i")) > -1)
                                    return false;

                                continue;
                            }

                            if (a.title && a.title.search(new RegExp(str, "i")) == -1)
                                return false;

                            a.highlight = a.highlight && a.highlight.replace(new RegExp(`(${str})`, 'ig'), '<mark>$1</mark>');
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
                    sortable: true,
                    options: years,
                },
                {
                    field: 'rank',
                    label: 'Rank',
                    centered: true,
                    width: 20,
                    isSearchable: true,
                    sortable: true,
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
                    sortable: true,
                    options: this.ccfcats.map(_ => ({
                        value: _.id.toString(),
                        name: _.title,
                    })),
                    customSearch: function (a, input) {
                        if (!input) return true;
                        return a.category == input;
                    },
                },
            ];
            let search = JSON.parse(localStorage.getItem("SEARCH") || JSON.stringify({
                perPage: 10,
                noteExist: false,
                filters: [],
            }));
            search.filters.forEach(f => {
                columns.find(_ => _.field === f.field).filter = f.filter;
            });

            this.columns = columns;
            this.stats = papers.stats;
            this.filename = papers.filename;
            this.papers = pps;
            this.perPage = search.perPage;
            this.noteExist = search.noteExist;
        }

        if (paperType == "remote") {
            let years = [...Array(12).keys()].map(_ => _ + 2011);
            let columns = [{
                    field: 'title',
                    label: 'Title',
                    width: 300,
                    isSearchable: true,
                    sortable: true,
                },
                {
                    field: 'year',
                    label: 'Year',
                    centered: true,
                    numeric: true,
                    width: 20,
                    isSearchable: true,
                    sortable: true,
                    options: generateOptions(years),
                },
                {
                    field: 'rank',
                    label: 'Rank',
                    centered: true,
                    width: 10,
                    isSearchable: true,
                    sortable: true,
                    options: generateOptions(['Any', 'ABC', 'A', 'B', 'C', 'NotABC']),
                },
                {
                    field: 'category',
                    label: 'Category',
                    centered: true,
                    width: 10,
                    isSearchable: true,
                    sortable: true,
                    options: this.ccfcats.map(_ => ({
                        value: _.id.toString(),
                        name: _.title,
                    })),
                },
            ];
            let search = JSON.parse(localStorage.getItem("SEARCH") || JSON.stringify({
                perPage: 10,
                filters: [],
            }));
            search.filters.forEach(f => {
                columns.find(_ => _.field === f.field).filter = f.filter;
            });

            this.online.columns = columns;
            this.perPage = search.perPage;
            this.loadAsyncData();
        }

        this.loadScript("patents.js")
            .then(() => {
                let columns = [{
                        field: 'title',
                        label: 'Title',
                        width: 100,
                        isSearchable: true,
                        sortable: true,
                        customSearch: function (a, input) {
                            input = input || '';
                            let ss = input.split(' ');
                            a.highlight = a.title;
                            for (let i = 0; i < ss.length; i++) {
                                const str = ss[i];
                                if (str == '') continue;
                                if (a.title.search(new RegExp(str, "i")) == -1)
                                    return false;

                                a.highlight = a.highlight.replace(new RegExp(`(${str})`, 'ig'), '<mark>$1</mark>');
                            }
                            return true;
                        },
                    },
                    {
                        field: 'pubdate',
                        label: 'Date',
                        centered: true,
                        numeric: true,
                        width: 20,
                        isSearchable: true,
                        sortable: true,
                    },
                    {
                        field: 'type',
                        label: 'Type',
                        centered: true,
                        width: 20,
                        isSearchable: true,
                        sortable: true,
                    },
                ];
                this.patents = patents;
                this.patent = {
                    columns
                };
            });
    },
    methods: {
        loadScript(src) {
            return new Promise(function (resolve, reject) {
                let shouldAppend = false;
                let el = document.querySelector('script[src="' + src + '"]');
                if (!el) {
                    el = document.createElement('script');
                    el.type = 'text/javascript';
                    el.async = true;
                    el.src = src;
                    shouldAppend = true;
                } else if (el.hasAttribute('data-loaded')) {
                    resolve(el);
                    return;
                }

                el.addEventListener('error', reject);
                el.addEventListener('abort', reject);
                el.addEventListener('load', function loadScriptHandler() {
                    el.setAttribute('data-loaded', true);
                    resolve(el);
                });

                if (shouldAppend) document.head.appendChild(el);
            });
        },
        search(word) {
            let col = this.columns.find(_ => _.field == 'title');
            Vue.set(col, 'filter', word);
        },
        compress(c) {
            var x = 'charCodeAt',
                b, e = {},
                f = c.split(""),
                d = [],
                a = f[0],
                g = 256;
            for (b = 1; b < f.length; b++) c = f[b], null != e[a + c] ? a += c : (d.push(1 < a.length ? e[a] : a[x](0)), e[a + c] = g, g++, a = c);
            d.push(1 < a.length ? e[a] : a[x](0));
            for (b = 0; b < d.length; b++) d[b] = String.fromCharCode(d[b]);
            return d.join("")
        },
        decompress(b) {
            var a, e = {},
                d = b.split(""),
                c = f = d[0],
                g = [c],
                h = o = 256;
            for (b = 1; b < d.length; b++) a = d[b].charCodeAt(0), a = h > a ? d[b] : e[a] ? e[a] : f + c, g.push(a), c = a.charAt(0), e[o] = f + c, o++, f = a;
            return g.join("")
        },
        expandNote(row) {
            this.notes[row.doi] = this.notes[row.doi] || {}
            this.tags = this.getTags();
            this.saveNotes();
        },
        saveNotes() {
            localStorage.setItem("NOTES", JSON.stringify(this.notes));
        },
        saveSearch() {
            const search = {
                perPage: this.perPage,
                noteExist: this.noteExist,
                filters: this.columns.map(_ => ({
                    field: _.field,
                    filter: _.filter
                })),
            };
            localStorage.setItem("SEARCH", JSON.stringify(search));
        },
        getTags() {
            let ts = Object.values(this.notes)
                .map(_ => _.tags || [])
                .reduce((a, b) => a.concat(b));
            let fts = ts
                .groupBy()
                .map(_ => ({
                    tag: _.key,
                    count: _.values.length
                }))
                .sort((a, b) => a.count > b.count ? -1 : 1)
                .slice(0, 8);
            return fts;
        },
        loadAsyncData() {
            this.online.loading = true
            var graph = graphql("http://localhost:5293/graphql", {
                asJSON: true,
                fragments: {
                    paper: "on ExportPaper { title doi type year publisher key authors }",
                }
            })

            let q = "";
            const bounds = [];
            for (let i = 0; i < this.online.columns.length; i++) {
                const col = this.online.columns[i];
                if (col.isSearchable && col.filter) {
                    if (col.field == "title") {
                        q = col.filter;
                    } else {
                        bounds.push(`${col.field}:${col.filter}`);
                    }
                }
            }
            const request = graph(`query ($q:String!,$b:String!,$start:Int!,$pagesize:Int!){
                papers(query: $q bound: $b start: $start pagesize: $pagesize) {
                  total
                  start
                  papers {
                    ...paper
                  }
                }
              }`);

            const highlightKeys = q.split(" ");
            request({
                q,
                b: bounds.join(" "),
                start: (this.online.page - 1) * this.perPage,
                pagesize: Number(this.perPage),
            }).then((response) => {
                const data = response.papers;

                this.online.papers = []
                this.online.total = data.total;
                let findccf = (key) => this.ccf.find(_ => key && key.startsWith(_.crossref)) || {};
                let pps = data.papers.map(_ => Object.assign({}, {
                    pub: (_.publisher || '').replace(/[^A-Z]/g, ''),
                    rank: findccf(_.key).rank,
                    category: findccf(_.key).category,
                    highlight: _.title && highlightKeys.reduce((pv, cv) => pv.replace(new RegExp(`(${cv})`, 'ig'), '<mark>$1</mark>'), _.title),
                }, _))
                this.online.papers = pps;

                this.online.loading = false
            }).catch((error) => {
                console.warn(error)
                this.online.papers = []
                this.online.total = 0
                this.online.loading = false
                throw error
            })
        },
        onFilterChange() {
            const search = {
                perPage: this.perPage,
                filters: this.online.columns.map(_ => ({
                    field: _.field,
                    filter: _.filter
                })),
            };
            localStorage.setItem("SEARCH", JSON.stringify(search));
            clearTimeout(this.online.inputTimeout)
            this.online.inputTimeout = setTimeout(() => {
                this.loadAsyncData();
            }, 400)
        },
        onPageChange(page) {
            this.online.page = page
            this.loadAsyncData()
        },
        onSort(field, order) {
            this.online.sortField = field
            this.online.sortOrder = order
            this.loadAsyncData()
        },
    },
    computed: {
        filterPapers() {
            if (!this.papers) return null;
            this.saveSearch();
            return this.papers.filter(item => {
                if (this.noteExist && (!this.notes[item.doi] || Object.keys(this.notes[item.doi]).length === 0)) return false;
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
        filterPatents() {
            if (!this.patents) return null;
            // this.saveSearch();
            return this.patents.filter(item => {
                // if (this.noteExist && (!this.notes[item.doi] || Object.keys(this.notes[item.doi]).length === 0)) return false;
                for (let i = 0; i < this.patent.columns.length; i++) {
                    const col = this.patent.columns[i];
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
            let ws = this.filterPapers.map(_ => split(_.title)).reduce((a, b) => a.concat(b), []);
            let cleanWords = ws.map(_ => _.toLowerCase())
                .filter(_ => _)
                .filter(_ => NonLexicalWords.indexOf(_) == -1)
                .filter(_ => NotCountWords.indexOf(_) == -1)
                .filter(_ => _.indexOf('blockchain') == -1);
            let wordsStats = cleanWords
                .groupBy()
                .map(_ => ({
                    Word: _.key,
                    Count: _.values.length
                }))
                .filter(_ => _.Count > 1)
                .sort((a, b) => a.Count > b.Count ? -1 : 1)
                .slice(0, 40);

            return wordsStats;
        },
    },
})