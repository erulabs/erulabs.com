import React from "react";
import "./App.css";
import "skeleton-css/css/skeleton.css";

function App() {
  return (
    <div className="app">
      <div class="container">
        <div class="row">
          <div class="three columns sidebar">
            <div class="more">Hi, I'm Seandon Mooy!</div>
            <div class="less">- - - - - - - - - - - - - -</div>
            <div class="small">
              I live in San Francisco and write computer programs. Read my blog
              if you're interested in DevOps, MySQL, Linux &amp; performance
              tuning! Currently working on{" "}
              <a href="https://kubesail.com">KubeSail.com</a>
            </div>
            <div class="less">- - - - - - - - - - - - - -</div>
            <div>
              work @ <a href="https://kubesail.com">KubeSail</a>
            </div>
            <div>
              <a href="mailto:seandon.mooy@gmail.com">email</a> /{" "}
              <a href="https://keybase.io/erulabs/pgp_keys.asc?fingerprint=9e36d604ad4db02a305864b79a190fee8e2e80ad">
                pgp
              </a>
            </div>
            <div>
              <a href="https://github.com/erulabs">github</a> /{" "}
              <a href="https://keybase.io/erulabs">socialmedia</a>
            </div>
            <div>
              <a href="https://github.com/erulabs/erulabs.com">view source</a>
            </div>
            <div class="less">- - - - - - - - - - - - - -</div>
          </div>
          <div class="nine columns content">
            <div class="blog">
              <h2>Founded KubeSail!</h2>
              <div>
                Please check out <a href="https://kubesail.com">my startup</a>,
                a cloud platform with zero compromise and a ridiculously good
                free tier that you could also run on your laptop!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
