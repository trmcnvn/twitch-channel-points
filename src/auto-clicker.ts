(function () {
  let cleanupHistoryListener = null;
  let targetNode: Element | null = null;
  const intervalIds = [];
  const config: MutationObserverInit = {
    attributes: false,
    childList: true,
    subtree: false
  };
  const observer = new MutationObserver(mutationCallback);

  function mutationCallback(mutations: MutationRecord[], observer: MutationObserver) {
    for (let mutation of mutations) {
      if (mutation.type === 'childList' && targetNode !== null) {
        const interactiveElement = targetNode.querySelector<HTMLButtonElement>('.tw-interactive');
        if (interactiveElement !== null) {
          interactiveElement.click();
        }
      }
    }
  }

  function findPointsContainer() {
    const timer = setInterval(function() {
      targetNode = document.querySelector('.community-points-summary');
      if (targetNode !== null ) {
        observer.observe(targetNode, config);
        clearInterval(timer);
      }
    }, 500);
    intervalIds.push(timer);
  }

  function hookIntoReact() {
    // Watch for navigation changes within the React app
    function reactNavigationHook(history) {
      let lastPathName = history.location.pathname;
      cleanupHistoryListener = history.listen(function(location) {
        if (location.pathname !== lastPathName) {
          lastPathName = location.pathname;
          cleanup();
          start();
        }
      });
    }

    // Find a property within the React component tree
    function findReactProp(node: any, prop: string, func: (value: any) => void) {
      if (node.stateNode && node.stateNode.props && node.stateNode.props[prop]) {
        func(node.stateNode.props[prop]);
      } else if (node.child) {
        let child = node.child;
        while (child) {
          findReactProp(child, prop, func);
          child = child.sibling;
        }
      }
    }

    // Find the react instance of a element
    function findReactInstance(element: string, target: string, func: (instance: any) => void) {
      const timer = setInterval(function() {
        const reactRoot = document.getElementById(element);
        if (reactRoot !== null) {
          let reactInstance = null;
          for (let key of Object.keys(reactRoot)) {
            if (key.startsWith(target)) {
              reactInstance = reactRoot[key];
              break;
            }
          }
          if (reactInstance) {
            func(reactInstance);
            clearInterval(timer);
          }
        }
      }, 500);
      intervalIds.push(timer);
    }

    // Find the root instance and hook into the router history
    findReactInstance('root', '_reactRootContainer', function(instance) {
      if (instance._internalRoot && instance._internalRoot.current) {
        // Hook into router
        findReactProp(instance._internalRoot.current, 'history', reactNavigationHook);
        // Determine if the channel has points enabled
        findReactProp(instance._internalRoot.current, 'isChannelPointsEnabled', function(value) {
          if (value === true) {
            findPointsContainer();
          }
        });
      }
    });
  }

  function start() {
    window.addEventListener('beforeunload', cleanup);
    hookIntoReact();
  }

  function cleanup() {
    for (const id of intervalIds) {
      clearInterval(id);
    }
    if (cleanupHistoryListener !== null) {
      cleanupHistoryListener();
    }
  }

  if (targetNode !== null) {
    observer.observe(targetNode, config);
  }
})();
