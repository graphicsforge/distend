import bpy
import os
import sys
import re
import json
import math
from mathutils import *

base_filename = os.environ['basestl']
input_filename = os.environ['inputfile']
output_filename = os.environ['outputstl']
json= os.environ['json']

target_y_dim = 500
target_z_dim = .2

# import the specified svg
bpy.ops.import_curve.svg(filepath=input_filename)
imported_curve = bpy.data.objects['Curve']
bpy.context.scene.objects.active=imported_curve
bpy.ops.object.editmode_toggle()
bpy.ops.object.modifier_add(type='SOLIDIFY')
bpy.ops.object.editmode_toggle()
bpy.ops.object.select_all(action='DESELECT')
imported_curve.select=True
bpy.ops.transform.resize(value=(target_y_dim/imported_curve.dimensions[1], target_y_dim/imported_curve.dimensions[1], target_z_dim/imported_curve.dimensions[2]))
bpy.ops.object.origin_set(type='GEOMETRY_ORIGIN', center='MEDIAN')
bpy.ops.export_mesh.stl(filepath=output_filename)

# export json
bpy.ops.object.convert(target='MESH', keep_original=False)
if base_filename!='':
  bpy.ops.import_mesh.stl(filepath=base_filename)
  base_stl=bpy.data.objects[0]
  base_stl.name = 'base_stl'
  bpy.ops.object.select_all(action='SELECT')
  bpy.ops.object.join();

bpy.ops.object.editmode_toggle()
bpy.ops.uv.sphere_project(direction='VIEW_ON_EQUATOR', align='POLAR_ZX', correct_aspect=True, clip_to_bounds=True, scale_to_bounds=False)
bpy.ops.object.editmode_toggle()
bpy.ops.export_mesh.vajson(filepath=json)
