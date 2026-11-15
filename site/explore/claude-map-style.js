/* Directly transcribed from the owner's AO_Explore_AppDesign.html
   aoLayers() and AO_BASE. No sample map points, regional polygons,
   demo provider registries, schedules, font files or bundled MapLibre.
   Donor full-file SHA256: 97d56600db6118e1a826004d90970db155aa7f7e2c5662e1b6acec0a04b4e771 */
const F=["Noto Sans Regular"],FI=["Noto Sans Italic"];
const layers=[
 {id:"landcover",type:"fill",source:"omt","source-layer":"landcover",filter:["in","class","wood","forest","grass"],paint:{"fill-color":"#141b17","fill-opacity":["interpolate",["linear"],["zoom"],4,0,8,.55]}},
 {id:"park",type:"fill",source:"omt","source-layer":"park",minzoom:8,paint:{"fill-color":"#16201a","fill-opacity":.6}},
 {id:"landuse-res",type:"fill",source:"omt","source-layer":"landuse",minzoom:9,filter:["in","class","residential","suburb","neighbourhood"],paint:{"fill-color":"#171b22","fill-opacity":.7}},
 {id:"water",type:"fill",source:"omt","source-layer":"water",paint:{"fill-color":"#070a0f"}},
 {id:"water-edge",type:"line",source:"omt","source-layer":"water",paint:{"line-color":"rgba(214,184,122,.22)","line-width":["interpolate",["linear"],["zoom"],2,.4,10,1]}},
 {id:"waterway",type:"line",source:"omt","source-layer":"waterway",minzoom:7,paint:{"line-color":"#0f2a3c","line-width":["interpolate",["linear"],["zoom"],7,.6,14,3]}},
 {id:"building",type:"fill",source:"omt","source-layer":"building",minzoom:13.5,paint:{"fill-color":"#1b2028","fill-outline-color":"#252b35"}},
 {id:"road-minor",type:"line",source:"omt","source-layer":"transportation",minzoom:12,filter:["in","class","minor","service","tertiary"],paint:{"line-color":"#1f242c","line-width":["interpolate",["linear"],["zoom"],12,.6,16,5]}},
 {id:"road-main",type:"line",source:"omt","source-layer":"transportation",minzoom:7,filter:["in","class","primary","secondary","trunk"],paint:{"line-color":"#262c36","line-width":["interpolate",["linear"],["zoom"],7,.4,16,7]}},
 {id:"road-motor",type:"line",source:"omt","source-layer":"transportation",minzoom:5,filter:["==","class","motorway"],paint:{"line-color":"#2c323d","line-width":["interpolate",["linear"],["zoom"],5,.4,16,8]}},
 {id:"rail",type:"line",source:"omt","source-layer":"transportation",minzoom:9,filter:["==","class","rail"],paint:{"line-color":"#2a2f38","line-width":.8,"line-dasharray":[3,3]}},
 {id:"admin4",type:"line",source:"omt","source-layer":"boundary",minzoom:4.5,filter:["all",["==","admin_level",4],["!=","maritime",1]],paint:{"line-color":"rgba(214,184,122,.22)","line-width":.7,"line-dasharray":[3,2]}},
 {id:"admin2",type:"line",source:"omt","source-layer":"boundary",filter:["all",["==","admin_level",2],["!=","maritime",1]],paint:{"line-color":"rgba(214,184,122,.5)","line-width":["interpolate",["linear"],["zoom"],1,.5,6,1.3]}},
 {id:"water-name",type:"symbol",source:"omt","source-layer":"water_name",maxzoom:8,layout:{"text-field":["get","name:latin"],"text-font":FI,"text-size":11,"text-letter-spacing":.25,"text-transform":"uppercase"},paint:{"text-color":"rgba(214,184,122,.38)"}},
 {id:"road-name",type:"symbol",source:"omt","source-layer":"transportation_name",minzoom:14,layout:{"text-field":["get","name"],"text-font":F,"text-size":10,"symbol-placement":"line"},paint:{"text-color":"#6f6a60","text-halo-color":"#12161c","text-halo-width":1.2}},
 {id:"place-village",type:"symbol",source:"omt","source-layer":"place",minzoom:10,filter:["in","class","village","suburb","neighbourhood"],layout:{"text-field":["get","name"],"text-font":F,"text-size":10.5},paint:{"text-color":"#7d7566","text-halo-color":"#12161c","text-halo-width":1.4}},
 {id:"place-town",type:"symbol",source:"omt","source-layer":"place",minzoom:7.5,filter:["==","class","town"],layout:{"text-field":["get","name"],"text-font":F,"text-size":11.5},paint:{"text-color":"#958b78","text-halo-color":"#12161c","text-halo-width":1.4}},
 {id:"place-city",type:"symbol",source:"omt","source-layer":"place",minzoom:6.6,filter:["==","class","city"],layout:{"text-field":["get","name"],"text-font":F,"text-size":["interpolate",["linear"],["zoom"],5,10.5,10,14],"text-letter-spacing":.05},paint:{"text-color":"#b8ac93","text-halo-color":"#12161c","text-halo-width":1.5}},
 {id:"place-country",type:"symbol",source:"omt","source-layer":"place",minzoom:3.6,maxzoom:7,filter:["==","class","country"],layout:{"text-field":["get","name:latin"],"text-font":F,"text-size":10.5,"text-transform":"uppercase","text-letter-spacing":.3},paint:{"text-color":"rgba(214,184,122,.55)","text-halo-color":"#12161c","text-halo-width":1.2}}
];
export const CLAUDE_MAP_STYLE={
 version:8,
 glyphs:"https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
 sources:{omt:{type:"vector",url:"https://tiles.openfreemap.org/planet"}},
 layers:[{id:"bg",type:"background",paint:{"background-color":"#12161c"}},...layers]
};
