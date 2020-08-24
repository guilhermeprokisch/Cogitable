module.exports = app => {
  app.on(
    [
      "issues.created",
      "issue_comment.created",
      "issue_comment.edited",
      "issues.edited"
    ],
    async context => {
      
      app.log(context.name)
      if (context.isBot && context.name == "issue_comment") {
        return;
      }

      if (context.name == "issues") {
        
        var id = context.payload.issue.id;
        var body = context.payload.issue.body;
      } else {
        var body = context.payload.comment.body;
        var id = context.payload.comment.id;
      }

      var reg = /\[\[(.+?)\]\]/g;
      var links = [];
      var owner = context.repo().owner;
      var repo = context.repo().repo;
      var onwer_repo = owner + "/" + repo;

      if (context.name == "issues") {
        var current_issue = context.payload.issue;
      } else {
        var current_issue = await context.github.issues.get(
          context.repo({
            issue_number: context.issue().number
          })
        );
        current_issue = current_issue.data
      }
      

      if (body.match(/\[\[(.+?)\]\]/g)) {
        var match;
        while ((match = reg.exec(body)) !== null) {
          const link = match[1];
          context.github.search;
          const results = await context.github.search.issuesAndPullRequests(
            context.repo({
              q: link + `repo:${onwer_repo}`,
              order: "asc",
              per_page: 1
            })
          );
          const items = results.data.items;
          app.log(typeof items[0] !== 'undefined')
          if (typeof items !== 'undefined' && typeof items[0] !== 'undefined') {
            var result_number = items[0].number;
            var result_title = items[0].title;
          } else {
            var result_title = null;
          }
          let link_number;
          if (link === result_title) {
            link_number = result_number;
          } else {
            let new_issue = await context.github.issues.create(
              context.repo({
                title: link,
                body: " "
              })
            );
            link_number = new_issue.data.number;
          }
          links.push([link, link_number]);
        }
      } else {
        app.log("No Matchs");
      }
      links.forEach(
        link =>
          (body = body.replace(`[[${link[0]}]]`, `[${link[0]}](${link[1]})`))
      );

      links.forEach(link =>
         context.github.issues.createComment(
          context.repo({
            issue_number: link[1],
            body:
              `Cited on [${current_issue.title}](${current_issue.number}#issuecomment-${id})  \n > ` +
              body
          })
        )
      );

      if (context.name === "issues") {
        await context.github.issues.update(
          context.repo({
            issue_number: current_issue.number,
            body: body
          })
        );
      } else {
        await context.github.issues.updateComment(
          context.repo({
            comment_id: id,
            body: body
          })
        );
      }
    }
  );
};
