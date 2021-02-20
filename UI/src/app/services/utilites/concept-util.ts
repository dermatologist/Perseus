export function getConceptFieldNameByType(columnType: string, connectedToConceptFields: any){
    let names = connectedToConceptFields.filter(it => it.endsWith(columnType));
    if(columnType === 'concept_id'){
      names = names.filter(it=> !it.endsWith('source_concept_id') && !it.endsWith('type_concept_id'))
    }
    return names[0];
  }


  export function createConceptField(fields, fieldName: string, targetFieldName: string, clone?: string, condition?: string){
    fields[ fieldName ] = {
      field: '',
      targetFieldName: targetFieldName,
      targetCloneName: clone,
      sql: '',
      sqlApplied: false,
      constant: '',
      selected: false,
      constantSelected: true,
      condition: condition,
      alreadySelected: false
    }
  }

  export function createConceptFields(conceptFields: any, clone?: string, condition?: string){
    const fields = {};
    createConceptField(fields, 'concept_id', getConceptFieldNameByType('concept_id', conceptFields), clone, condition);
    createConceptField(fields, 'source_value', getConceptFieldNameByType('source_value', conceptFields), clone, condition);
    createConceptField(fields, 'source_concept_id', getConceptFieldNameByType('source_concept_id', conceptFields), clone, condition);
    createConceptField(fields, 'type_concept_id', getConceptFieldNameByType('type_concept_id', conceptFields), clone, condition);
    return fields;
  }