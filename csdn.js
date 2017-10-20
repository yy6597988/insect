var cheerio = require('cheerio')
var superagent = require('superagent')
var async = require('async')
var url = require('url')
var fs = require("fs")

var express = require('express')
var app = express()

var eventproxy = require('eventproxy')
var ep = eventproxy()

var baseUrl = 'http://blog.csdn.net/web/index.html'
var pageUrls = []
for (var _i = 1; _i < 4; _i++) {
    pageUrls.push(baseUrl + '?&page=' + _i)
}

app.get('/', function (req, res, next) {
    var authorUrls = []

    pageUrls.forEach(function (page) {
        superagent.get(page).end(function (err, sres) {
            if (err) {
                return next(err);
            }
            
            var $ = cheerio.load(sres.text)

            $('.csdn-tracking-statistics').each(function (i, e) {
                var u = $('a', e).attr('href')
                if (authorUrls.indexOf(u) === -1) {
                    authorUrls.push(u)
                }
            })

            ep.emit('get_topic_html', 'get authorUrls successful')
        })
    })


    ep.after('get_topic_html', pageUrls.length, function (eps) {
        var concurrencyCount = 0

        async.mapLimit(authorUrls, 5, function (myurl, callback) {
            fetchUrl(myurl, callback)
        }, function (err, result) {
            res.send(result)
            // fs.writeFile("./file.txt", JSON.stringify(result))
        })
        
        function fetchUrl(myurl, callback) {
            var fetchStart = new Date().getTime()
            concurrencyCount++

            console.log('现在的并发数是', concurrencyCount, '，正在抓取的是', myurl)

            superagent.get(myurl)
                .end(function (err, ssres) {
                    if (err) {
                        callback(err, myurl + ' error happened!')
                    }

                    var time = new Date().getTime() - fetchStart;
                    console.log('抓取 ' + myurl + ' 成功', '，耗时' + time + '毫秒')
                    
                    concurrencyCount--

                    var $ = cheerio.load(ssres.text)
                    var result = {
                        userId: url.parse(myurl).pathname.substring(1),
                        blogTitle: $("#blog_title a").text(),
                        visitCount: parseInt($('#blog_rank>li').eq(0).text().split(/[:：]/)[1]),
                        score: parseInt($('#blog_rank>li').eq(1).text().split(/[:：]/)[1]),
                        oriCount: parseInt($('#blog_statistics>li').eq(0).text().split(/[:：]/)[1]),
                        copyCount: parseInt($('#blog_statistics>li').eq(1).text().split(/[:：]/)[1]),
                        trsCount: parseInt($('#blog_statistics>li').eq(2).text().split(/[:：]/)[1]),
                        cmtCount: parseInt($('#blog_statistics>li').eq(3).text().split(/[:：]/)[1])
                    };
                    callback(null, result)
                })
        }
    })
})

app.listen(3000, function (req, res) {
    console.log('app is running at port 3000')
})
