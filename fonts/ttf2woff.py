#!python3

import sys, re, os, json
from fontTools.ttLib import TTFont
from collections import OrderedDict

fontsdir = os.path.dirname(sys.argv[0])
infont = outfont = None

fontExtension = re.compile(r'\.[ot]tf', re.I)

allAxes = {}

def getName(ttf, nameID):
    return [n for n in ttf['name'].names if n.nameID==nameID][0].toUnicode()

os.chdir(fontsdir)
for infont in os.listdir(os.getcwd()):
    if not fontExtension.search(infont):
        continue
    print(infont)
    outwoff = fontExtension.sub('.woff', infont)
    outwoff2 = fontExtension.sub('.woff2', infont)
    try:
        ttf = TTFont(infont)
    except:
        print("Error opening {}".format(infont))
        continue
    ttf.flavor='woff'
    ttf.save(outwoff)
    ttf.flavor='woff2'
    ttf.save(outwoff2)

    axes = OrderedDict()
    if 'STAT' in ttf and hasattr(ttf['STAT'], 'table'):
        axes['order'] = [a.AxisTag for a in sorted(ttf['STAT'].table.DesignAxisRecord.Axis, key=lambda a:a.AxisOrdering)]

    if 'fvar' in ttf:
        for axis in ttf['fvar'].axes:
            axes[axis.axisTag] = {
                'name': getName(ttf, namesaxis.nameID if hasattr(axis, 'nameID') else axis.axisNameID),
                'min': axis.minValue,
                'max': axis.maxValue,
                'default': axis.defaultValue
            }
        axes['instances'] = []
        if hasattr(ttf['fvar'], 'instances'):
            for instance in ttf['fvar'].instances:
                axes['instances'].append({
                    'axes': instance.coordinates,
                    'name': getName(ttf, instance.nameID if hasattr(instance, 'nameID') else instance.subfamilyNameID),
                })

    allAxes[fontExtension.sub('', infont)] = axes

with open('axes.json', 'w', encoding='utf-8') as axesFile:
    json.dump(allAxes, axesFile, indent=2, ensure_ascii=False)
