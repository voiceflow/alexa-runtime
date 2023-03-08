class Multimodal {
  getDisplayDocument = (displayId: number, project?: any): null | Record<string, any> => {
    try {
      const document = project?.platformData?.displays?.[displayId];
      if (!document) return null;

      return JSON.parse(document);
    } catch (e) {
      return null;
    }
  };
}

export default Multimodal;
