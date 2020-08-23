module.exports = app => {

  app.on(['issue_comment.created', 'issue_comment.edited' ], async context => {

    let body = context.payload.comment.body
    var reg = /\[\[(.+?)\]\]/g  
    var links = []

    var current_issue = await context.github.issues.get(context.repo({
        issue_number: context.issue().number 
    }))

    if (body.match(/\[\[(.+?)\]\]/g)){

        var match
        while((match = reg.exec(body)) !== null) {
            const link = match[1]
            context.github.search
            const results = await context.github.search.issuesAndPullRequests(context.repo({
                q: link,
                order: 'asc',
                per_page: 1
            }))
            const items = results.data.items
            if (typeof items !== undefined && typeof items[0] !== undefined){
                var result_number = items[0].number
                var result_title = items[0].title 
            }else{
                var result_title = null
            }
            let link_number
            if( link === result_title ){
                link_number = result_number
            }else{
                let new_issue = await context.github.issues.create(context.repo({
                    title: link
                }))
                link_number = new_issue.data.number
            }
            links.push([link, link_number])
        }
    }else{
        app.log('No Matchs')
    }
    links.forEach(link => body = body.replace(`[[${link[0]}]]`, `[${link[0]}](${link[1]})`))

    links.forEach(( link => context.github.issues.createComment(context.repo({
        issue_number: link[1],
        body: `Cited on [${current_issue.data.title}](${current_issue.data.number}#issuecomment-${context.payload.comment.id})  \n > `  + body 
      }))
    ))
    await context.github.issues.updateComment(context.repo({
        comment_id: context.payload.comment.id, 
        body: body
    }))

  })
}
