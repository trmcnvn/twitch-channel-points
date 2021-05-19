(function() {
  let cleanupHistoryListener = null;
  let targetNode: Element | null = null;
  const intervalIds = [];
  const config: MutationObserverInit = {
    attributes: false,
    childList: true,
    subtree: true
  };
  const observer = new MutationObserver(mutationCallback);

  function mutationCallback(
    mutations: MutationRecord[],
    _observer: MutationObserver
  ) {
    for (let _mutation of mutations) {
      if (targetNode !== null) {
        clickBonus();
      }
    }
  }

  function clickBonus() {
    const interactiveElement = targetNode.querySelector<HTMLButtonElement>(
      '.VGQNd'
    );
    if (interactiveElement !== null) {
      interactiveElement.click();
    }
  }

  function findPointsContainer() {
    const timer = setInterval(function() {
      targetNode = document.querySelector(
        '.community-points-summary > div:last-child'
      );
      if (targetNode !== null) {
        // Check if there is already a bonus to collect
        clickBonus();

        // Observe for future bonuses
        observer.observe(targetNode, config);
        clearInterval(timer);
      }
    }, 1000);
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
    function findReactProp(
      node: any,
      prop: string,
      func: (value: any) => void
    ) {
      if (
        node.stateNode &&
        node.stateNode.props &&
        node.stateNode.props[prop]
      ) {
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
    function findReactInstance(
      element: string,
      target: string,
      func: (instance: any) => void
    ) {
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
        findReactProp(
          instance._internalRoot.current,
          'history',
          reactNavigationHook
        );
        // Determine if the channel has points enabled (May take some time to load)
        const timer = setInterval(function() {
          findReactProp(
            instance._internalRoot.current,
            'isChannelPointsEnabled',
            function(value) {
              if (value) {
                findPointsContainer();
              }
              clearInterval(timer);
            }
          );
        }, 1000);
        intervalIds.push(timer);
      }
    });
  }

  function start() {
    window.removeEventListener('beforeunload', cleanup);
    window.addEventListener('beforeunload', cleanup);
    hookIntoReact();
  }

  function cleanup() {
    observer.disconnect();
    for (const id of intervalIds) {
      clearInterval(id);
    }
    if (cleanupHistoryListener !== null) {
      cleanupHistoryListener();
    }
  }

  start();
  console.log('Twitch Channel Points Auto-Clicker');
})();
