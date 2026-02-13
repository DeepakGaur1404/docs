(function () {
  // prevent double-init across route transitions
  if (window.SwytchcodeEmbed) return;
  window.SwytchcodeEmbed = true;

  // ✅ Mintlify-safe config (no currentScript reliance)
  var globalConfig = window.__SWYTCHCODE__ || {};
  var embedUrl = (
    globalConfig.embedUrl ||
    "https://mintlify-swtchycode-vercel-deploy.vercel.app/"
  ).replace(/\/+$/, "");

  var config = {
    theme: globalConfig.theme || "light",
    position: globalConfig.position || "right",
    inline:
      typeof globalConfig.inline === "boolean" ? globalConfig.inline : true,
    buttonLabel: globalConfig.buttonLabel || "Ask SwytchCode",
    // inlineLabel: globalConfig.inlineLabel || "Ask SwytchCode about this code",
    zIndex: Number(globalConfig.zIndex || 2147483000),
    offset: Number(globalConfig.offset || 24),
    autoOpen: !!globalConfig.autoOpen,
  };

  function init() {
    console.log("[SwytchCode] embedUrl resolved:", embedUrl);

    var iframeUrl = new URL(embedUrl);
    iframeUrl.searchParams.set("embed", "1");
    iframeUrl.searchParams.set("parent_origin", window.location.origin);
    iframeUrl.searchParams.set("theme", config.theme);

    var iframeOrigin = iframeUrl.origin;
    var overlay, iframe;
    var pendingContext = null;
    var iframeReady = false;

    function injectStyles() {
      if (document.getElementById("swytchcode-embed-styles")) return;
      var style = document.createElement("style");
      style.id = "swytchcode-embed-styles";
      style.textContent =
        ".sc-embed-btn{position:fixed;bottom:" +
        config.offset +
        "px;" +
        (config.position === "left" ? "left:" : "right:") +
        config.offset +
        "px;z-index:" +
        config.zIndex +
        ';background:#f97316;color:#fff;border:none;border-radius:999px;padding:12px 16px;font:600 13px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.18);cursor:pointer}' +
        ".sc-embed-btn:hover{background:#ea580c}" +
        ".sc-embed-overlay{position:fixed;inset:0;z-index:" +
        config.zIndex +
        ";display:none;align-items:flex-end;justify-content:" +
        (config.position === "left" ? "flex-start" : "flex-end") +
        ";background:rgba(0,0,0,0.22)}" +
        ".sc-embed-panel{position:relative;width:420px;max-width:95vw;height:85vh;max-height:95vh;background:#fff;border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,0.28);overflow:hidden;margin:" +
        config.offset +
        "px}" +
        '.sc-embed-close{position:absolute;top:8px;right:8px;z-index:2;background:#fff;border:1px solid #e5e7eb;border-radius:999px;padding:6px 8px;font:600 12px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}' +
        '.sc-embed-inline{display:inline-flex;align-items:center;gap:6px;margin:8px 0 0 0;padding:6px 10px;border-radius:999px;border:1px solid #fed7aa;background:#fff7ed;color:#9a3412;font:600 11px/1 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;cursor:pointer}' +
        ".sc-embed-inline:hover{background:#ffedd5}";
      document.head.appendChild(style);
    }

    function ensureOverlay() {
      if (overlay) return;
      overlay = document.createElement("div");
      overlay.className = "sc-embed-overlay";
      overlay.setAttribute("aria-hidden", "true");

      var panel = document.createElement("div");
      panel.className = "sc-embed-panel";

      var closeBtn = document.createElement("button");
      closeBtn.className = "sc-embed-close";
      closeBtn.type = "button";
      closeBtn.textContent = "Close";
      closeBtn.addEventListener("click", function () {
        overlay.style.display = "none";
        overlay.setAttribute("aria-hidden", "true");
      });

      iframe = document.createElement("iframe");
      iframe.title = "SwytchCode Chat";
      iframe.setAttribute("allow", "clipboard-read; clipboard-write");
      iframe.style.border = "0";
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.addEventListener("load", function () {
        iframeReady = true;
        if (pendingContext) postContext(pendingContext);
      });

      panel.appendChild(closeBtn);
      panel.appendChild(iframe);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          overlay.style.display = "none";
          overlay.setAttribute("aria-hidden", "true");
        }
      });
    }

    function openOverlay() {
      ensureOverlay();
      if (iframe && !iframe.src) iframe.src = iframeUrl.toString();
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
    }

    function postContext(context) {
      if (!iframe || !iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        { type: "swytchcode:context", payload: context },
        iframeOrigin,
      );
    }

    function queueContext(context) {
      pendingContext = context;
      if (iframeReady) postContext(context);
    }

    function collectContext(target) {
      var selection = "";
      try {
        var sel = window.getSelection();
        if (sel && sel.toString) selection = sel.toString().trim();
      } catch (err) {}

      var codeText =
        target && target.textContent ? target.textContent.trim() : "";
      return {
        source: "external_docs",
        url: window.location.href,
        title: document.title || "",
        code: codeText,
        selection: selection,
      };
    }

    function openChatWithContext(ctx) {
      openOverlay();
      queueContext(ctx);
    }

    function createFloatingButton() {
      var button = document.createElement("button");
      button.className = "sc-embed-btn";
      button.type = "button";
      button.textContent = config.buttonLabel;
      button.addEventListener("click", function () {
        openChatWithContext(collectContext(null));
      });
      document.body.appendChild(button);
    }

    function injectInlineButtons() {
      if (!config.inline) return;
      var blocks = document.querySelectorAll("pre");
      for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (block.getAttribute("data-swytchcode-bound")) continue;
        var txt = block.textContent ? block.textContent.trim() : "";
        if (!txt) continue;

        block.setAttribute("data-swytchcode-bound", "true");

        // var btn = document.createElement("button");
        // btn.className = "sc-embed-inline";
        // btn.type = "button";
        // btn.textContent = config.inlineLabel;
        btn.addEventListener("click", function (event) {
          var b = event.currentTarget;
          var pre = b && b.previousElementSibling;
          openChatWithContext(collectContext(pre));
        });

        block.parentNode &&
          block.parentNode.insertBefore(btn, block.nextSibling);
      }
    }

    injectStyles();
    createFloatingButton();
    injectInlineButtons();

    // Mintlify is SPA-like; watch for page changes
    if (window.MutationObserver) {
      var t = null;
      var obs = new MutationObserver(function () {
        if (t) return;
        t = setTimeout(function () {
          t = null;
          injectInlineButtons();
        }, 200);
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }

    if (config.autoOpen) openOverlay();
  }

  // ✅ Important for Mintlify: run after body exists
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
