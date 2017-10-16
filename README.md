# Hello World

This is a 100% static site with some neat blog-like features, an ultra simple codebase, and is also 100% open-source! In fact, you're reading the [README.md](https://github.com/erulabs/erulabs.com/blob/master/README.md) right now! Gulp runs `/buildPages.js` ([src](https://github.com/erulabs/erulabs.com/blob/master/buildPages.js)) which turns the /posts/ directory into a listing of static HTML files!

It's also about the 15th rewrite of this site, so thanks for coming back!

### Develop locally:
Just run `./bin/dev.sh`, that's all! Write your /posts/ in pure markdown, then deploy!

### 1. A server you can SSH to:
(As the `circleci` user)

This one is pretty simple - Take a look at `./bin/_variables.sh` and `./bin/deploy.sh`. Additionally, you'll need a directory that is writable: `mkdir /home/circleci/yoursite.com`

If this is the only site you're hosting, you literally cannot go small enough here. The site is entirely static and we'll work hard to cache and minify it aggressively.

### 2. A non-ssl bootstrap:
First, modify all the references to my website in `./bin/_variables.sh`.

Assuming you don't already have SSL certificates and want to use the LetsEncrypt setup here, you'll need to comment out the [SSL section of the nginx configuration](https://github.com/erulabs/erulabs.com/blob/master/inf/nginx/erulabs.conf#L12-L43) and run `./bin/deploy.sh`, then `./bin/letsencrypt.sh` - IE: You need a working HTTP service to collect your initial SSL certificates.

### 3. Permissions for the `circleci` user
The circleci user needs to be allowed to run two commands - copying the nginx configuration file and reloading nginx (see `./bin/deploy.sh`). You'll want to add:
```bash
Cmnd_Alias DEPLOY_CMDS = /bin/cp /home/circleci/erulabs.com/inf/nginx/erulabs.conf /etc/nginx/sites-enabled/erulabs.conf, /usr/sbin/service nginx reload
circleci ALL=(ALL) NOPASSWD: DEPLOY_CMDS
```
to your `/etc/sudoers` file with `visudo`. Obviously, you'll also want to add an SSH key that circleci can use to deploy with!

### 4. Some blog posts!

Just modify posts in `./posts/` while running `./bin/dev.sh`!
