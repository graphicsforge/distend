import bpy
import os
import sys
import re
import json
import math
from mathutils import *

# the boolean modifier
def booleanObjects(parent, child, mode):
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=parent
  # add modifier
  mod = bpy.ops.object.modifier_add(type='BOOLEAN')
  parent.modifiers[0].object = child
  parent.modifiers[0].operation = mode
  # apply modifier
  bpy.ops.object.modifier_apply(apply_as='DATA', modifier=parent.modifiers[0].name)
  # clean up child
  bpy.ops.object.select_all(action='DESELECT')
  child.select=True
  bpy.ops.object.delete(use_global=False)


base_filename = os.environ['basestl']
input_filename = os.environ['inputfile']
output_filename = os.environ['outputstl']
json= os.environ['json']
if base_filename!='':
  bpy.ops.import_mesh.stl(filepath=base_filename)
  bpy.ops.import_mesh.stl(filepath=input_filename)
  input_stl=bpy.data.objects[0]
  input_stl.name = 'input_stl'
  base_stl=bpy.data.objects[0]
  base_stl.name = 'base_stl'
else:
  bpy.ops.import_mesh.stl(filepath=input_filename)
  input_stl=bpy.data.objects[0]
print('status 20%')
bpy.context.scene.objects.active=input_stl
bpy.ops.export_mesh.stl(filepath=output_filename)
print('status 30%')

bpy.ops.object.select_all(action='SELECT')
if base_filename!='':
  bpy.ops.object.join();
bpy.ops.object.editmode_toggle()
#bpy.ops.uv.smart_project(angle_limit=66)
bpy.ops.uv.sphere_project(direction='VIEW_ON_EQUATOR', align='POLAR_ZX', correct_aspect=True, clip_to_bounds=True, scale_to_bounds=False)
bpy.ops.object.editmode_toggle()
bpy.ops.export_mesh.vajson(filepath=json)
