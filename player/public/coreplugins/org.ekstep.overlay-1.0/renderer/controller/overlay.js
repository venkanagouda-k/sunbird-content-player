'use strict';

app.controllerProvider.register("OverlayController", function($scope, $rootScope, $compile, $stateParams) {
    var globalConfig = EkstepRendererAPI.getGlobalConfig();
    $rootScope.isItemScene = false;
    $rootScope.menuOpened = false;
    $rootScope.stageId = undefined;
    $scope.state_off = "off";
    $scope.state_on = "on";
    $scope.state_disable = "disable";
    $scope.showOverlayGoodJob = true;
    $scope.showOverlayTryAgain = true;
    $scope.overlayEvents = ["overlaySubmit", "overlayMenu", "overlayReload", "overlayGoodJob", "overlayTryAgain"];
    $scope.overlayVisible = false;
    $scope.pluginInstance = undefined;
    $scope.imageBasePath = globalConfig.assetbase;
    $scope.showTeacherIns = true;
    $scope.showReload = true;
    $scope.init = function() {
        EkstepRendererAPI.addEventListener("renderer:overlay:show", $scope.showOverlay);
        EkstepRendererAPI.addEventListener("renderer:overlay:hide", $scope.hideOverlay);

        EkstepRendererAPI.addEventListener("renderer:content:start", $scope.showOverlay);

        $scope.pluginInstance = EkstepRendererAPI.getPluginObjs("org.ekstep.overlay");
        if (globalConfig.language_info) {
            var languageInfo = JSON.parse(globalConfig.language_info);
            for (key in languageInfo) {
                AppLables[key] = languageInfo[key];
            }
        }
        $scope.AppLables = AppLables;
        if (!_.isUndefined(globalConfig.overlay.menu) && !globalConfig.overlay.menu.showTeachersInstruction)
            $scope.showTeacherIns = globalConfig.overlay.menu.showTeachersInstruction;
        if (!globalConfig.overlay.showReload)
            $scope.showReload = globalConfig.overlay.showReload;
        var evtLenth = $scope.overlayEvents.length;
        for (var i = 0; i < evtLenth; i++) {
            var eventName = $scope.overlayEvents[i];
            EventBus.addEventListener(eventName, $scope.overlayEventHandler, $scope);
        }
        EventBus.addEventListener("sceneEnter", function(data) {
            $scope.showOverlay();
            $rootScope.stageData = data.target;
            //TODO: Remove this currentStage parameter and use directly stageData._currentStage
            $rootScope.stageId = !_.isUndefined($rootScope.stageData) ? $rootScope.stageData._id : undefined;
        });
        if ($scope.pluginInstance) {
            console.log("Show overlay is failed to on event handler");
            if (globalConfig.overlay.showOverlay) {
                $scope.overlayVisible = $scope.pluginInstance.overlayVisible;
                $scope.safeApply();
            }
        }
    }

    $scope.showOverlay = function() {
        if (!globalConfig.overlay.showOverlay) return;

        $scope.overlayVisible = true;
        $scope.safeApply();
    }

    $scope.hideOverlay = function() {
        $scope.overlayVisible = false;
        $scope.safeApply();
    }

    $scope.navigate = function(navType) {
        if (!$rootScope.content) {
            // if $rootScope.content is not available get it from the base controller
            org.ekstep.contentrenderer.getContentMetadata($stateParams.itemId);
        }
        GlobalContext.currentContentId = $rootScope.content.identifier;
        GlobalContext.currentContentMimeType = $rootScope.content.mimeType;
        if (navType === "next") {
            TelemetryService.interact("TOUCH", navType, null, {
                stageId: EkstepRendererAPI.getCurrentStageId()
            });
            EventBus.dispatch("actionNavigateNext", navType);
            EventBus.dispatch("nextClick");

        } else if (navType === "previous") {
            TelemetryService.interact("TOUCH", navType, null, {
                stageId: EkstepRendererAPI.getCurrentStageId()
            });
            EventBus.dispatch("actionNavigatePrevious", navType);
            EventBus.dispatch("previousClick");
        }
    }

    $scope.loadOverlay = function() {
        var gameArea = angular.element('#gameArea');
    }

    $rootScope.defaultSubmit = function() {
        EventBus.dispatch("actionDefaultSubmit");
    }

    $scope.openUserSwitchingModal = function() {
        TelemetryService.interact("TOUCH", "gc_open_userswitch", "TOUCH", {
            stageId: EkstepRendererAPI.getCurrentStageId() ? EkstepRendererAPI.getCurrentStageId() : $rootScope.pageId
        });
        EventBus.dispatch("event:openUserSwitchingModal");
        $scope.hideMenu();
    }

    $scope.overlayEventHandler = function(event) {
        //Switch case to handle HTML elements(Next, Previous, Submit, etc..)
        switch (event.type) {
            case "overlaySubmit":
                if (event.target === "off") {
                    $scope.showOverlaySubmit = false;
                } else {
                    $scope.showOverlaySubmit = true;
                    (event.target === "disable") ? $rootScope.enableEval = false: $rootScope.enableEval = true;
                }
                break;
            case "overlayMenu":
                break;
            case "overlayReload":
                break;
            case "overlayGoodJob":
                $scope.showOverlayGoodJob = event.target;
                break;
            case "overlayTryAgain":
                $scope.showOverlayTryAgain = event.target;
                break;
            default:
                break;
        }
        $rootScope.safeApply();
    }

    $scope.openMenu = function() {
        //display a layer to disable clicking and scrolling on the gameArea while menu is shown
        if (jQuery('.menu-overlay').css('display') == "block") {
            $scope.hideMenu();
            return;
        }
        $scope.menuOpened = true;
        TelemetryService.interact("TOUCH", "gc_menuopen", "TOUCH", {
            stageId: $rootScope.stageId
        });
        jQuery('.menu-overlay').css('display', 'block');
        jQuery(".gc-menu").show();
        jQuery(".gc-menu").animate({
            "marginLeft": ["0%", 'easeOutExpo']
        }, 700, function() {});
    }

    $scope.hideMenu = function() {
        $scope.menuOpened = false;
        TelemetryService.interact("TOUCH", "gc_menuclose", "TOUCH", {
            stageId: $rootScope.stageId
        });
        jQuery('.menu-overlay').css('display', 'none');
        jQuery(".gc-menu").animate({
            "marginLeft": ["-31%", 'easeOutExpo']
        }, 700, function() {});
    }

    $scope.replayContent = function() {
        var data = {
            'interactId': 'ge_replay',
            'callback': $scope.replayCallback
        };
        EkstepRendererAPI.dispatchEvent('renderer:content:close', undefined, data);
    }

    $scope.replayCallback = function() {
        $scope.hideMenu();
        EkstepRendererAPI.dispatchEvent('renderer:content:replay');
    }

    $scope.init();
});

app.compileProvider.directive('mute', function($rootScope) {
    return {
        restrict: 'E',
        template: '<div ng-click="toggleMute()"><img src="{{muteImg}}"/><span>Sound {{AppLables.mute}} </span></div>',
        link: function(scope, url) {
            $rootScope.$on('renderer:overlay:unmute', function() {
                scope.muteImg = scope.imageBasePath + "audio_icon.png";
                AppLables.mute = "on";
                AudioManager.unmute();
            });
            $rootScope.$broadcast('renderer:overlay:unmute');
            scope.toggleMute = function() {
                if (AudioManager.muted) {
                    AudioManager.unmute();
                    scope.muteImg = scope.imageBasePath + "audio_icon.png";
                    AppLables.mute = "on";
                } else {
                    AudioManager.mute();
                    scope.muteImg = scope.imageBasePath + "audio_mute_icon.png";
                    AppLables.mute = "off";
                }
                TelemetryService.interact("TOUCH", AudioManager.muted ? "gc_mute" : "gc_unmute", "TOUCH", {
                    stageId: Renderer.theme._currentStage
                });
            }
        }
    }
});

app.compileProvider.directive('reloadStage', function($rootScope) {
    return {
        restrict: 'E',
        template: '<span class="reload-stage" onclick="EventBus.dispatch(\'actionReload\')"><img id="reload_id" src="{{imageBasePath}}icn_replayaudio.png" style="width:100%;"/></span>'
    }
});

app.compileProvider.directive('menu', function($rootScope, $sce) {
    return {
        restrict: 'E',
        scope: false,
        link: function(scope) {
            scope.getTemplate = function() {
                return scope.pluginInstance._menuTP;
            }
        },
        template: "<div ng-include=getTemplate()></div>"
    }
});

app.compileProvider.directive('stageInstructions', function($rootScope) {
    return {
        restrict: 'E',
        template: '<div ng-class="{\'icon-opacity\' : !stageData.params.instructions}" ng-click="showInstructions()"><img ng-src="{{imageBasePath}}icn_teacher.png" style="z-index:2;" alt="note img"/><span> {{AppLables.instructions}} </span></div>',
        controller: function($scope, $rootScope) {
            $scope.stageInstMessage = "";
            $scope.showInst = false;

            $scope.showInstructions = function() {
                $scope.stageInstMessage = ($rootScope.stageData && $rootScope.stageData.params && $rootScope.stageData.params.instructions) ? $rootScope.stageData.params.instructions : null;

                $scope.showInst = ($scope.stageInstMessage != null) ? true : false;
                $scope.logIntract("gc_showInst");
            }

            $scope.closeInstructions = function() {
                $scope.showInst = false;
                $scope.logIntract("gc_closeInst");
            }

            $scope.logIntract = function(eleId) {
                TelemetryService.interact("TOUCH", eleId, "TOUCH", {
                    stageId: Renderer.theme._currentStage
                });
            }

            /*
             * If menu is getting hide, then hide teacher instructions as well
             */
            $scope.$watch("menuOpened", function() {
                if (!$rootScope.menuOpened) {

                    $scope.showInst = false;
                }
            });
        }
    }
});

app.compileProvider.directive('assess', function($rootScope) {
    return {
        restrict: 'E',
        scope: {
            image: '=',
            show: '='
        },
        template: '<a class="assess" ng-class="assessStyle" href="javascript:void(0);" ng-click="onSubmit()">{{showOverlaySubmit}} <!-- enabled --><img ng-src="{{image}}"/></a>',
        link: function(scope, element) {
            scope.labelSubmit = AppLables.submit;
        },
        controller: function($scope, $rootScope, $timeout) {
            $scope.isEnabled = false;
            $scope.assessStyle = 'assess-disable';

            $rootScope.$watch('enableEval', function() {
                $scope.isEnabled = $rootScope.enableEval;
                if ($scope.isEnabled) {
                    $timeout(function() {
                        // This timeout is required to apply the changes(because it is calling by JS)
                        $scope.assessStyle = 'assess-enable';
                        $scope.image = globalConfig.assetbase + "submit_enable.png";
                    }, 100);
                } else {
                    //Disable state
                    $scope.assessStyle = 'assess-disable';
                    $scope.image = globalConfig.assetbase + "submit_disable.png";
                }
            });

            $scope.onSubmit = function() {
                if ($scope.isEnabled) {
                    $rootScope.defaultSubmit();
                    EventBus.dispatch("submitClick");
                }
            }
        }
    }
});

app.compileProvider.directive('goodJob', function($rootScope) {
    return {
        restrict: 'E',
        template: '<div class="popup"> <div class="popup-overlay" ng-click="hidePopup()"></div> <div class="popup-full-body"> <div class="font-lato assess-popup assess-tryagain-popup"> <div class="correct-answer" style=" text-align: center;"> <div class="banner"> <img ng-src="{{imageBasePath}}banner1.png" height="80%" width="40%"> </div> <div class="sign-board"> <img ng-src="{{imageBasePath}}check.png" width="40%" /> </div> </div> <div class="popup-buttons-container"> <div ng-click="hidePopup(); moveToNextStage(\'next\');" class="primary center button">{{AppLables.next}}</div> </div> </div> </div> </div>',
        controller: function($scope, $rootScope, $timeout) {
            $scope.retryAssessment = function(id, e) {
                $scope.hidePopup(id);
                EventBus.dispatch("retryClick");
            }

            $scope.hidePopup = function(id) {
                TelemetryService.interact("TOUCH", id ? id : "gc_popupclose", "TOUCH", {
                    stageId: ($rootScope.pageId == "endpage" ? "endpage" : $rootScope.stageId)
                });
                $scope.showOverlayGoodJob = false;
                $scope.showOverlayTryAgain = false;
            }

            $scope.moveToNextStage = function(navType) {
                EventBus.dispatch("actionNavigateSkip", navType);
                EventBus.dispatch("skipClick");
            }
        }
    }
});

app.compileProvider.directive('tryAgain', function($rootScope) {
    return {
        restrict: 'E',
        template: '<div class="popup"> <div class="popup-overlay" ng-click="hidePopup()"></div> <div class="popup-full-body"> <div class="font-lato assess-popup assess-tryagain-popup"> <div class="wrong-answer" style=" text-align: center;"> <div class="banner"> <img ng-src="{{imageBasePath}}banner2.png" height="80%" width="40%"> </div> <div class="sign-board"> <img ng-src="{{imageBasePath}}retry.png" id="retryButton" width="40%" style="z-index:100;" /> <img ng-src="{{imageBasePath}}incorrect.png" width="40%" id="incorrectButton" /> </div> </div> <div class="popup-buttons-container"> <div ng-click="hidePopup()" class="left button">{{AppLables.next}}</div> <div ng-click="retryAssessment(\'gc_retry\', $event);" href="javascript:void(0);" class="right primary button">{{AppLables.tryAgain}}</div> </div> </div> </div> </div>'
    }
});

//#sourceURL=overlay.js