import bpy
import os
import sys
import re
import json
import math
from mathutils import *

workUnitsDone = 0
workUnitsEstimated = 10.0

def log( output ):
  print( output )
  sys.stdout.flush()

def setProgress( percent ):
  global workUnitsDone
  global workUnitsEstimated
  workUnitsDone = workUnitsEstimated*percent/100;
  log('status %.0f%%' % (workUnitsDone/workUnitsEstimated*100.0) )

def logProgress( done ):
  global workUnitsDone
  global workUnitsEstimated
  workUnitsDone = workUnitsDone+done
  log('status %.0f%%' % (workUnitsDone/workUnitsEstimated*100) )

setProgress(2);

def loadSTL(input_filename, base_filename=''):
  if base_filename!='':
    bpy.ops.import_mesh.stl(filepath=base_filename)
    bpy.ops.import_mesh.stl(filepath=input_filename)
    input_stl=bpy.data.objects[0]
    input_stl.name = 'input_stl'
    base_stl=bpy.data.objects[0]
    if base_stl.name=='input_stl':
      base_stl=bpy.data.objects[1]
    base_stl.name = 'base_stl'

    bpy.ops.object.select_all(action='DESELECT')
    base_stl.select=True
    bpy.context.scene.objects.active=base_stl
    bpy.ops.object.editmode_toggle()
    bpy.ops.mesh.select_all(action='SELECT');
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.editmode_toggle()

  else:
    bpy.ops.import_mesh.stl(filepath=input_filename)
    input_stl=bpy.data.objects[0]
  # make normals consistent
  bpy.ops.object.select_all(action='DESELECT')
  input_stl.select=True
  bpy.context.scene.objects.active=input_stl
  bpy.ops.object.editmode_toggle()
  bpy.ops.mesh.select_all(action='SELECT');
  bpy.ops.mesh.normals_make_consistent(inside=False)
  bpy.ops.object.editmode_toggle()
  logProgress(2)

def outputModel(filename):
  bpy.ops.export_mesh.stl(filepath=filename)
  logProgress(1)

def outputVArray(filename):
  bpy.ops.object.select_all(action='SELECT')
  if len(bpy.context.selected_objects)>1:
    bpy.ops.object.join();
  bpy.ops.object.editmode_toggle()
  bpy.ops.mesh.select_all(action='SELECT');
  bpy.ops.uv.sphere_project(direction='VIEW_ON_EQUATOR', align='POLAR_ZX', correct_aspect=True, clip_to_bounds=True, scale_to_bounds=False)
  bpy.ops.object.editmode_toggle()
  bpy.ops.export_mesh.vajson(filepath=filename)
  logProgress(1)

# the boolean modifier
def boolean(parent, child, mode):
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
  logProgress(2)

def lapSmooth(factor, iterations=1):
  model=bpy.data.objects[0]
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=model
  mod = bpy.ops.object.modifier_add(type='LAPLACIANSMOOTH')
  model.modifiers[0].iterations = iterations
  model.modifiers[0].lambda_factor = factor
  bpy.ops.object.modifier_apply(apply_as='DATA', modifier=model.modifiers[0].name)
  model.select=True
  logProgress(1)


def remesh( mode='SHARP', octree=8 ):
  bpy.ops.object.modifier_add(type='REMESH')
  bpy.context.object.modifiers['Remesh'].mode = mode
  bpy.context.object.modifiers['Remesh'].octree_depth = octree
  bpy.context.object.modifiers['Remesh'].remove_disconnected_pieces = False
  bpy.ops.object.modifier_apply(apply_as='DATA', modifier=bpy.context.object.modifiers['Remesh'].name)
  logProgress(1)

def decimate( verts ):
  model=bpy.data.objects[0]
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=model
  mod = bpy.ops.object.modifier_add(type='DECIMATE')
  # see what ratio we need to decimate by
  ratio = verts/len(model.data.vertices)
  if ratio>1:
    ratio = 1
  print('decimating with mode collapse, ratio %.4f' % ratio)
  model.modifiers[0].decimate_type = 'COLLAPSE'
  model.modifiers[0].ratio = ratio
  bpy.ops.object.modifier_apply(apply_as='DATA', modifier=model.modifiers[0].name)
  print('%d output verts' % len(model.data.vertices))
  model.select=True
  logProgress(1)

def simpleDeform(mode, factor, pivotx, pivoty, pivotz):
  model=bpy.data.objects[0]
  pivotPosition = float(pivotx)*model.dimensions[0], float(pivoty)*model.dimensions[1], float(pivotz)*model.dimensions[2]
  bpy.ops.mesh.primitive_cube_add(location=(pivotPosition))
  pivot=bpy.data.objects[0]
  pivot.name='pivot'
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=model
  mod = bpy.ops.object.modifier_add(type='SIMPLE_DEFORM')
  model.modifiers[0].deform_method = mode
  model.modifiers[0].factor = factor
  model.modifiers[0].origin = pivot
  bpy.ops.object.modifier_apply(apply_as='DATA', modifier=model.modifiers[0].name)
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=pivot
  pivot.select=True
  bpy.ops.object.delete(use_global=False)
  bpy.context.scene.objects.active=model
  model.select=True
  logProgress(1)

def wireframe( thickness ):
  model=bpy.data.objects[0]
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=model
  model.select=True
  bpy.ops.object.mode_set(mode='EDIT')
  bpy.ops.mesh.wireframe(thickness=thickness)
  bpy.ops.object.mode_set(mode='OBJECT')
  logProgress(1)


def surfaceSpawn(parent, child, scale, frequency):
  # rotate the child so that it points outwards
  bpy.ops.object.select_all(action='DESELECT')
  child.select=True
  bpy.context.scene.objects.active=child
  #bpy.ops.transform.rotate(value=-1.5708, axis=(1,0,0))
  bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
  bpy.ops.object.select_all(action='DESELECT')
  bpy.context.scene.objects.active=parent
  # add particles
  bpy.ops.object.particle_system_add()
  bpy.data.particles["ParticleSettings"].physics_type = "NO"
  bpy.data.particles["ParticleSettings"].frame_start = -1
  bpy.data.particles["ParticleSettings"].frame_end = 0
  bpy.data.particles["ParticleSettings"].count = int(frequency)
  bpy.data.particles["ParticleSettings"].render_type = 'OBJECT'
  bpy.data.particles["ParticleSettings"].dupli_object = child
  bpy.data.particles["ParticleSettings"].size_random = .75
  bpy.data.particles["ParticleSettings"].particle_size = float(scale)
  bpy.ops.object.select_all(action='SELECT')
  bpy.ops.object.duplicates_make_real()
  bpy.ops.object.make_single_user(type='SELECTED_OBJECTS', object=True, obdata=True)
  # clean up child
  bpy.ops.object.select_all(action='DESELECT')
  child.select=True
  bpy.ops.object.delete(use_global=False)
  bpy.context.scene.objects.active=bpy.data.objects[1]
  # join spawned
  bpy.ops.object.select_all(action='SELECT')
  parent.select=False
  bpy.ops.object.join();
  remesh('SMOOTH', 7)
  bpy.context.scene.objects.active=parent
  parent.select=True
  bpy.ops.object.particle_system_remove()
  #boolean(bpy.data.objects[0], bpy.data.objects[1], 'UNION')
  
  bpy.ops.object.select_all(action='DESELECT')
  parent.select=True
  bpy.context.scene.objects.active=parent
  bpy.ops.object.delete(use_global=False)

  bpy.data.objects[0].select=True
  bpy.context.scene.objects.active=bpy.data.objects[0]

